export interface SampleLetter {
  id: string;
  title: string;
  category: string;
  language: "en" | "hi" | "ta";
  text: string;
}

export const SAMPLE_LETTERS: SampleLetter[] = [
  {
    id: "tax-notice",
    title: "Income Tax Demand Notice (Sec 143(1))",
    category: "Government Notice",
    language: "en",
    text: `GOVERNMENT OF INDIA
INCOME TAX DEPARTMENT
OFFICE OF THE ASSESSING OFFICER, WARD 14(2), BENGALURU
Central Revenue Building, Queens Road, Bengaluru - 560001

Date of Issue: 2025-07-10
Notice DIN: ITD/AST/2025-26/1431/982341
PAN: ABCDE1234F

To: Shri Ramesh Kumar Sharma
Flat 402, Shanti Vihar Apartments, Koramangala, Bengaluru - 560034

SUB: INTIMATION UNDER SECTION 143(1) OF THE INCOME TAX ACT, 1961 FOR ASSESSMENT YEAR 2024-25

Sir/Madam,

This is to inform you that your Income Tax Return for Assessment Year 2024-25 has been processed under Section 143(1). Upon verification, an apparent discrepancy in tax deduction claims was detected resulting in a net payable demand of Rs. 14,250/- (Rupees Fourteen Thousand Two Hundred and Fifty only).

ACTIONS REQUIRED:
1. Verify the computation details on the e-filing portal (https://eportal.incometax.gov.in).
2. Pay the outstanding demand amount of Rs. 14,250/- online, or submit your online response disagreeing with the demand.
3. You are strictly required to clear this demand or submit your objection on or before 2025-08-15.

DOCUMENTS NEEDED:
If you disagree with this demand, keep ready:
- Form 16 / Form 16A issued by your employer/bank
- Bank account statement showing tax deductions
- Copy of your ITR-V acknowledgment

CONSEQUENCES OF NON-COMPLIANCE:
If the demand is not resolved or paid by the due date, interest under Section 220(2) @ 1% per month will be charged, and recovery proceedings may be initiated under Section 222 of the Income Tax Act.

CONTACTS & ASSISTANCE:
Helpline: 1800-180-1961 (Toll-Free)
Official Portal: https://incometax.gov.in
Assessing Officer Email: ward14.2.blr@incometax.gov.in`,
  },
  {
    id: "bank-kyc",
    title: "Bank Re-KYC Updation Notice",
    category: "Bank Letter",
    language: "en",
    text: `BHARAT NATIONAL BANK
Retail Banking Operations, Bandra Kurla Complex, Mumbai - 400051

Ref: BNB/KYC/RE-VAL/2025/4412
Date: 2025-09-01

To: Mrs. Ananya Sundaram
Account No: 309822104928

Subject: MANDATORY PERIODIC KYC UPDATION UNDER RBI DIRECTIVES

Dear Valued Customer,

In accordance with Reserve Bank of India (RBI) guidelines on Know Your Customer (KYC) norms, all savings bank accounts are subject to periodic re-verification. Our records show that your KYC update for the above-referenced account is now overdue.

REQUIRED ACTION:
You are requested to submit your updated KYC documents at your nearest Bharat National Bank branch or through our official mobile banking application on or before 2025-10-15.

DOCUMENTS REQUIRED TO BRING:
- Original Passport or Voter ID or Driving Licence
- Self-attested copy of PAN Card (or Form 60)
- Recent utility bill (electricity/piped gas not older than 2 months)
- Two recent passport-size colour photographs

CONSEQUENCE OF INACTION:
Failure to submit the requisite documents by 2025-10-15 will result in a temporary partial freeze on debit transactions and withdrawal restrictions as per regulatory guidelines.

FOR ASSISTANCE:
24x7 Customer Care: 1800-425-2222
Official Web Portal: https://www.bharatnatbank.co.in/kyc-update`,
  },
  {
    id: "power-relative",
    title: "Electricity Overload Notice (Relative 15-Day Deadline)",
    category: "Utility Notice",
    language: "en",
    text: `ELECTRICITY DISTRIBUTION COMPANY LTD. (EDCL)
Revenue & Metering Cell, Sector 18, Noida - 201301

Consumer No: CA-88401920-E
Notice Ref: EDCL/MTR/DEF/2025/1109
Date of Notice: 2025-06-10

NOTICE TO RECTIFY METER DEFECT AND SUBMIT LOAD REGULARIZATION FORM

Dear Consumer,

During a site audit conducted by our technical inspection team, the digital meter installed at your premises was found to be displaying an overload error (Code E-04), indicating connected load exceeds your sanctioned limit of 3 kW.

ACTIONS TO BE TAKEN:
1. Apply for load enhancement from 3 kW to 5 kW using Form ED-2 available on the web portal.
2. Submit your load regularization form along with the inspection fee of Rs. 1,500/- within 15 days of the issue of this notice.

DOCUMENTS REQUIRED:
- Electricity connection account bill receipt
- Copy of ownership proof / lease deed of premises
- Signed electrician test certificate (Annexure B)

CONSEQUENCE OF DELAY:
If compliance is not made within 15 days of this notice, your power supply will be disconnected without further intimation as per Regulation 4.2 of the Electricity Supply Code.

CUSTOMER CARE:
Call Centre: 1912 (24x7 toll-free)
Online Portal: https://www.edcl-power.example.org`,
  },
];
