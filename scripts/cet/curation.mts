export interface InstituteCuration {
  commonName?: string;
  searchAliases?: readonly string[];
  locality?: string;
  city?: string;
}

// Search aliases and familiar short names are deliberately maintained outside
// generated official records. They never replace the official institute name.
export const instituteCuration: Readonly<Record<string, InstituteCuration>> = {
  "06004": { commonName: "GCOEARA", searchAliases: ["Government College Avasari", "GCOE Avasari"], locality: "Avasari Khurd", city: "Pune district" },
  "06139": { commonName: "Modern COE", searchAliases: ["PES Modern", "MCOE Pune"], locality: "Shivajinagar", city: "Pune" },
  "06146": { commonName: "MITAOE", searchAliases: ["MIT Academy", "MIT Alandi"], locality: "Alandi", city: "Pune district" },
  "06156": { commonName: "MMCOE", searchAliases: ["MMCOE Pune", "Marathwada Mitra Mandal"], locality: "Karvenagar", city: "Pune" },
  "06175": { commonName: "PCCOE", searchAliases: ["Pimpri Chinchwad College", "PCET PCCOE"], locality: "Nigdi Pradhikaran", city: "Pimpri-Chinchwad" },
  "06177": { commonName: "SCOE Vadgaon", searchAliases: ["Sinhgad Vadgaon", "Sinhgad College Pune"], locality: "Vadgaon Budruk", city: "Pune" },
  "06207": { commonName: "DYPIET Pimpri", searchAliases: ["D Y Patil Pimpri", "DY Patil Institute of Technology"], locality: "Pimpri", city: "Pimpri-Chinchwad" },
  "06271": { commonName: "PICT", searchAliases: ["PICT Pune", "Pune Institute Computer Technology"], locality: "Dhankavdi", city: "Pune" },
  "06272": { commonName: "DYPCOE Akurdi", searchAliases: ["D Y Patil Akurdi", "DY Patil College Akurdi"], locality: "Akurdi", city: "Pimpri-Chinchwad" },
  "06273": { commonName: "VIT Pune", searchAliases: ["Vishwakarma Institute", "VIT Bibwewadi"], locality: "Bibwewadi", city: "Pune" },
  "06274": { commonName: "PVGCOET", searchAliases: ["PVG College", "PVGCOET Pune"], locality: "Parvati", city: "Pune" },
  "06276": { commonName: "Cummins College", searchAliases: ["Cummins Pune", "CCOEW"], locality: "Karvenagar", city: "Pune" },
  "06278": { commonName: "AISSMS COE", searchAliases: ["AISSMS", "AISSMS College Pune"], locality: "Shivajinagar", city: "Pune" },
  "06754": { commonName: "I2IT", searchAliases: ["International Institute of Information Technology Pune"], locality: "Hinjawadi", city: "Pune" },
  "06822": { commonName: "PCCOER", searchAliases: ["Pimpri Chinchwad College of Engineering and Research"], locality: "Ravet", city: "Pimpri-Chinchwad" },
  "03012": { commonName: "VJTI", searchAliases: ["Veermata Jijabai Technological Institute"], locality: "Matunga", city: "Mumbai" },
  "03014": { commonName: "SPCE", searchAliases: ["Sardar Patel College of Engineering"], locality: "Andheri", city: "Mumbai" },
  "03035": { commonName: "UMIT", searchAliases: ["Usha Mittal Institute of Technology"] },
};
