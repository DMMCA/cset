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
    
    public partial class REFERENCE_DOCS
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public REFERENCE_DOCS()
        {
            this.REFERENCES_DATA = new HashSet<REFERENCES_DATA>();
        }
    
        public int Reference_Doc_Id { get; set; }
        public string Doc_Name { get; set; }
        public string Doc_Link { get; set; }
        public string Doc_Short { get; set; }
        public Nullable<System.DateTime> Date_Updated { get; set; }
        public Nullable<System.DateTime> Date_Last_Checked { get; set; }
        public string Doc_Url { get; set; }
        public string Doc_Notes { get; set; }
    
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<REFERENCES_DATA> REFERENCES_DATA { get; set; }
    }
}

