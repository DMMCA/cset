////////////////////////////////
//
//   Copyright 2018 Battelle Energy Alliance, LLC
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.
//
////////////////////////////////
import { map } from 'rxjs/operators';
import { timer, Observable, Subject, asapScheduler, pipe, of, from, interval, merge, fromEvent } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';


import { JwtParser } from '../helpers/jwt-parser';
import { ChangePassword } from '../models/reset-pass.model';
import { CreateUser } from './../models/user.model';
import { ConfigService } from './config.service';
import { isNullOrUndefined } from 'util';

export interface LoginResponse {
    Token: string;
    PasswordResetRequired: boolean;
    IsSuperUser: boolean;
    UserLastName: string;
    UserFirstName: string;
    UserId: number;
    Email: string;
}

const headers = {
    headers: new HttpHeaders()
        .set('Content-Type', 'application/json'),
    params: new HttpParams()
};

@Injectable()
export class AuthenticationService {
    isLocal: boolean;

    private apiUrl: string;
    private initialized = false;

    constructor(private http: HttpClient, private router: Router, private configSvc: ConfigService, public dialog: MatDialog) {
        if (!this.initialized) {
            this.apiUrl = this.configSvc.apiUrl;
            this.initialized = true;
        }
    }

    checkLocal() {
        return this.http.post(this.apiUrl + 'auth/login/standalone',
            JSON.stringify({ TzOffset: new Date().getTimezoneOffset() }), headers)
            .toPromise().then(
                (response: LoginResponse) => {
                    if (response.Email === null || response.Email === undefined) {
                        this.isLocal = false;
                    } else {
                        this.isLocal = true;
                        this.storeUserData(response);
                    }
                },
                error => {
                    console.warn('Error getting stand-alone status. Assuming non-stand-alone mode.');
                    this.isLocal = false;
                });
    }

    storeUserData(user: LoginResponse) {
        sessionStorage.removeItem('userToken');
        sessionStorage.setItem('userToken', user.Token);
        sessionStorage.setItem('firstName', user.UserFirstName);
        sessionStorage.setItem('lastName', user.UserLastName);
        sessionStorage.setItem('resetPassword', '' + user.PasswordResetRequired);
        sessionStorage.setItem('superUser', '' + user.IsSuperUser);
        sessionStorage.setItem('userId', '' + user.UserId);
        sessionStorage.setItem('email', user.Email);
        sessionStorage.setItem('developer', String(false));


        // schedule the first token refresh event
        this.scheduleTokenRefresh(this.http, user.Token);
    }

    login(email: string, password: string) {
        sessionStorage.clear();
        sessionStorage.setItem('email', email);

        return this.http.post(this.apiUrl + 'auth/login',
            JSON.stringify({ Email: email, Password: password, TzOffset: new Date().getTimezoneOffset() }), headers).pipe(
                map((user: LoginResponse) => {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    this.storeUserData(user);
                    return user;
                }));
    }


    logout() {
        // remove user from session storage to log user out
        sessionStorage.clear();
        this.router.navigate(['/home/login'], { queryParamsHandling: "preserve" });
    }


    /**
      * Schedules an HTTP transaction to refresh the JWT.
      * @param http The current HttpClient instance.
      * @param token A JWT string.
      */
    scheduleTokenRefresh(http: HttpClient, token: string) {
        const refresh = timer(this.calcTokenRefreshTimeout(token));
        refresh.subscribe(
            val => {
                // only schedule a refresh if the user is currently logged on
                if (sessionStorage.getItem('userToken') != null) {

                    http.get(this.apiUrl + 'auth/token?refresh')
                        .subscribe((resp: LoginResponse) => {
                            sessionStorage.removeItem('userToken');
                            sessionStorage.setItem('userToken', resp.Token);

                            // schedule the next refresh
                            this.scheduleTokenRefresh(this.http, resp.Token);
                        }, error => {
                            console.log(<Error>error.message);
                        });
                }
            });
    }


    /**
      * Returns the timeout interval in milliseconds
      * @param token A JWT string.
      */
    calcTokenRefreshTimeout(token: string): number {
        // extract the expiration timestamp from the token
        const jwt = new JwtParser();
        const parsedToken = jwt.decodeToken(token);
        const expTimeUnix = parsedToken.exp;

        const nowUtcUnix = Math.floor((new Date()).getTime() / 1000);

        // how many seconds from now until expiry?
        const secondsUntilExpiration = expTimeUnix - nowUtcUnix;

        // refresh at 60 seconds lead time before expiry
        const leadSeconds = 60;
        const refreshIntervalMs = (secondsUntilExpiration - leadSeconds) * 1000;

        return refreshIntervalMs;
    }

    /**
     * Requests a JWT with a short lifespan.
     */
    getShortLivedToken() {
        return this.http.get(this.apiUrl + 'auth/token?expSeconds=30');
    }
    getShortLivedTokenForAssessment(assessment_id: number) {
        return this.http.get(this.apiUrl + 'auth/token?assessmentId=' + assessment_id + '&expSeconds=30');
    }

    changePassword(data: ChangePassword) {
        return this.http.post(this.apiUrl + 'ResetPassword/ChangePassword', JSON.stringify(data), headers);
    }

    editUser(data: CreateUser): Observable<CreateUser> {
        return this.http.post(this.apiUrl + 'contacts/UpdateUser', data, headers);
    }

    getUserInfo(): Observable<CreateUser> {
        return this.http.get(this.apiUrl + 'contacts/GetUserInfo');
    }

    passwordStatus() {
        return this.http.get(this.apiUrl + 'ResetPassword/ResetPasswordStatus/', headers);
    }

    getSecurityQuestionsList(email: string) {
        return this.http.get(this.apiUrl + 'ResetPassword/SecurityQuestions?email=' + email);
    }

    getSecurityQuestionsPotentialList() {
        return this.http.get(this.apiUrl + 'ResetPassword/PotentialQuestions');
    }

    userToken() {
        return sessionStorage.getItem('userToken');
    }

    userId(): number {
        return parseInt(sessionStorage.getItem('userId'), 10);
    }

    email() {
        return sessionStorage.getItem('email');
    }

    firstName() {
        return sessionStorage.getItem('firstName');
    }

    lastName() {
        return sessionStorage.getItem('lastName');
    }

    setUserInfo(info: CreateUser) {
        sessionStorage.setItem('firstName', info.FirstName);
        sessionStorage.setItem('lastName', info.LastName);
        sessionStorage.setItem('email', info.PrimaryEmail);
    }
}