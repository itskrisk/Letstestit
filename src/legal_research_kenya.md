# Kenya Data Protection Legal Framework for Muncheez
**Research Document - January 2026**

## Overview of Kenya's Data Protection Act 2019

The Kenya Data Protection Act (DPA) 2019, enacted November 25, 2019, establishes a comprehensive GDPR-aligned framework for data privacy in Kenya. The Act applies to ALL organizations (local and international) that handle personal data of individuals in Kenya.

**Regulatory Authority:** Office of the Data Protection Commissioner (ODPC)
**Website:** odpc.go.ke

---

## Core Data Protection Principles (Section 25)

1. **Lawfulness, Fairness & Transparency**
   - Data must be collected lawfully, honestly, and transparently
   - Clear information provided about data use

2. **Purpose Limitation**
   - Data collected for specified, explicit, legitimate purposes only
   - No further processing incompatible with original purpose

3. **Data Minimization**
   - Collect only data necessary for stated purpose

4. **Accuracy**
   - Personal data must be accurate and up-to-date
   - Reasonable steps to erase/rectify inaccurate data

5. **Storage Limitation**
   - Data not retained longer than necessary

6. **Integrity & Confidentiality**
   - Protection against unauthorized access, loss, or damage
   - Appropriate security safeguards required

7. **Accountability**
   - Controllers/processors must demonstrate compliance

---

## Key Compliance Requirements for Food Delivery Apps

### 1. ODPC Registration (Mandatory)
- **Who:** All data controllers and processors
- **Renewal:** Every 3 years
- **Penalty:** Fines up to KES 5 million or 1% of annual turnover (whichever is lower)

### 2. Consent Requirements
- Must be **explicit, informed, unequivocal, freely given, and specific**
- Pre-ticked boxes are INVALID
- Separate consent for different processing activities (especially marketing)
- Right to withdraw consent at any time

### 3. Data Protection Impact Assessment (DPIA)
- Required for high-risk processing activities
- Must document: data types, sources, collection methods, storage, access controls, retention

### 4. Data Breach Notification
- **To ODPC:** Within 72 hours of discovery
- **To Data Subjects:** When breach affects their rights
- **Third-party processors:** Must notify controller within 48 hours

### 5. Data Localization Requirement ⚠️
- **Critical:** At least ONE serving copy of personal data must be stored on a server/data center located in Kenya
- Cross-border transfers allowed only with:
  - Adequate data protection safeguards in receiving country
  - Data subject consent
  - ODPC approval (for sensitive data)

### 6. Data Subject Rights
- **Access:** Request copy of personal data (response within 7 days)
- **Rectification:** Correct inaccurate data (compliance within 14 days)
- **Erasure ("Right to be Forgotten"):** Request deletion
- **Object:** Object to processing
- **Portability:** Request data in machine-readable format
- **Withdraw Consent:** At any time
- **Lodge Complaints:** With ODPC

### 7. Security Safeguards Required
- Encryption (in transit and at rest)
- Access controls
- Regular security audits
- Staff training on data protection
- HTTPS/TLS for all data transmission

### 8. Privacy Policy Requirements
- Must be clear, transparent, and easily accessible
- Detail: data collected, purposes, how used/stored/protected, retention periods
- Update users when policy changes

---

## Specific Considerations for MUNCHEEZ

### Data We Collect
1. **Personal Information:**
   - Name, email, phone number
   - Delivery addresses (home, work, custom)
   
2. **Payment Information:**
   - M-Pesa phone numbers
   - Card details (tokenized via PCI-compliant processors)
   
3. **Order History:**
   - Restaurant orders, items, amounts
   - Delivery preferences
   
4. **Location Data:**
   - Real-time GPS for delivery tracking (with consent)
   - Saved addresses
   
5. **Device & Usage Data:**
   - IP address, device type, browser
   - App usage analytics
   
6. **Communication Data:**
   - Customer support interactions
   - Marketing preferences

### Legal Basis for Processing
1. **Contractual Necessity:** Processing orders, deliveries, payments
2. **Consent:** Marketing communications, location tracking, analytics
3. **Legal Obligation:** Tax records, law enforcement requests
4. **Legitimate Interest:** Fraud prevention, service improvement

### Data Sharing (Third Parties)
1. **Restaurant Partners:** Name, order details, delivery address
2. **Delivery Riders:** Delivery address, contact info, order details
3. **Payment Processors:** M-Pesa (Safaricom), card processors (PCI-DSS compliant)
4. **Service Providers:** Cloud hosting, analytics (Google Analytics), customer support tools
5. **Legal Requirements:** Law enforcement, court orders, tax authorities

### Data Retention Periods
- **Active Accounts:** Indefinitely while account is active
- **Order History:** 7 years (tax/accounting compliance)
- **Inactive Accounts:** 3 years, then deletion after notification
- **Payment Records:** 7 years (financial regulations)
- **Marketing Consent:** Until withdrawn

### Children's Data
- Muncheez not intended for users under 18
- Parental consent required for minors (under 18 in Kenya)
- Immediate deletion if child data discovered

---

## Penalties for Non-Compliance

1. **Administrative Fines:**
   - Up to KES 5 million OR 1% of annual turnover (whichever is lower)
   
2. **Operational Penalties:**
   - Suspension of data processing activities
   - Revocation of data processing licenses
   - Compliance orders from ODPC
   
3. **Criminal Prosecution:**
   - For serious violations
   - Imprisonment possible for egregious breaches

---

## ODPC Contact Information
- **Website:** www.odpc.go.ke
- **Email:** info@odpc.go.ke
- **Phone:** +254 20 2428704
- **Physical Address:** I&M Bank Building, 2nd Ngong Avenue, 12th Floor, Nairobi

---

## Action Items for Muncheez Compliance

### Immediate Actions
✅ Register with ODPC as data controller
✅ Create comprehensive Privacy Policy
✅ Create Terms of Service
✅ Implement explicit consent mechanisms (no pre-ticked boxes)
✅ Ensure data localization (at least one copy in Kenya)
✅ Implement encryption (HTTPS/TLS, data at rest)

### Within 3 Months
- [ ] Conduct full Data Protection Impact Assessment (DPIA)
- [ ] Appoint Data Protection Officer (DPO)
- [ ] Implement 72-hour breach notification procedures
- [ ] Create data subject rights request process
- [ ] Train all staff on data protection
- [ ] Audit third-party service providers for compliance

### Ongoing
- [ ] Annual security audits
- [ ] ODPC registration renewal (every 3 years)
- [ ] Privacy policy updates (with user notification)
- [ ] Monitor regulatory changes

---

## References & Sources

1. Kenya Data Protection Act, 2019 (No. 24 of 2019)
2. Data Protection (General) Regulations, 2021
3. Data Protection (Registration) Regulations, 2021
4. Office of the Data Protection Commissioner (ODPC) Guidelines
5. Competition Authority of Kenya (CAK) - Food Delivery Platform Guidelines
