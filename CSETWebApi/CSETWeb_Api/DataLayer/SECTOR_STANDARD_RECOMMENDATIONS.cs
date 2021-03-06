//////////////////////////////// 
// 
//   Copyright 2018 Battelle Energy Alliance, LLC  
// 
// 
//////////////////////////////// 
//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace DataLayer
{
    using System;
    using System.Collections.Generic;
    
    public partial class SECTOR_STANDARD_RECOMMENDATIONS
    {
        public int Sector_Id { get; set; }
        public int Industry_Id { get; set; }
        public string Organization_Size { get; set; }
        public string Asset_Value { get; set; }
        public string Set_Name { get; set; }
    
        public virtual SECTOR SECTOR { get; set; }
        public virtual SET SET { get; set; }
    }
}


