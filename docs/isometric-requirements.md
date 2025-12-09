# Isometric Verification & Compliance Requirements

> **Disclaimer:** This is a summary for reference. The authoritative sources are the official Isometric documentation and protocols linked at the end.

## 1. Verification Process Overview

| Stage | Description |
|-------|-------------|
| 1. V&V Kick-off | Meet Registry Operations Manager (ROM), intro to Certify platform |
| 2. Pre-screen | Submit PDD + LCA, Isometric scientists review and iterate |
| 3. Public Comment | PDD published for 30-day public comment period |
| 4. VVB Selection | Isometric sends RFP to accredited VVBs, selects auditor |
| 5. Validation | VVB assesses project methods against Isometric Standard + Protocol |
| 6. Verification | VVB evaluates GHG Statement for accuracy and compliance |
| 7. Credit Issuance | Credits issued to Registry after validation reports approved |

**Key Actors:**
- **ROM** - Registry Operations Manager (main point of contact)
- **VVB** - Validation & Verification Body (independent auditor)
- **Isometric** - Reviews all submissions, publishes to Registry

---

## 2. Key Certify Concepts

| Concept | Description |
|---------|-------------|
| **Source** | Evidence document for a datapoint (private, shared with VVB) |
| **Datapoint** | Any value used in GHG calculations (with optional std deviation) |
| **Component** | Physical activity with CO₂e flux, created from blueprints |
| **Removal** | All CO₂e fluxes for a removal event (sequestrations, losses, activities) |
| **GHG Statement** | Summary of net CO₂e removals for a reporting period |
| **Credit Batch** | Grouping of credit units (1 unit = 1 kg CO₂e removed) |

**Data Visibility:**
- Draft → Organization only
- Submitted → VVB access
- Verified → Public (except source documents)

---

## 3. Biochar Protocol v1.2 Requirements

### 3.1 Applicability
- Captures CO₂ via biomass feedstock → biochar through pyrolysis
- Stores biochar in approved environment (soil, low-oxygen burial, built environment)
- Provides **net-negative** CO₂e impact
- Storage duration >200 years

### 3.2 Durability Criteria
| Parameter | Threshold | Purpose |
|-----------|-----------|---------|
| H:Corg ratio | < 0.5 | 200-year durability |
| O:Corg ratio | < 0.2 | Chemical stability |

### 3.3 Storage Modules
| Module | Use Case |
|--------|----------|
| Biochar Storage in Soil Environments v1.2 | Agricultural application |
| Biochar Storage in Low Oxygen Burial v1.0 | Subsurface burial |
| Biochar Storage in Built Environment v1.0 | Construction materials |

### 3.4 Pollutant Limits
Must comply with World Biochar Certificate (WBC) limits for:
- PAHs (Polycyclic Aromatic Hydrocarbons)
- Heavy metals
- PCBs, dioxins, furans

---

## 4. GHG Accounting Requirements

### 4.1 Net CO₂e Removal Formula
```
CO₂e_Removal = CO₂e_Stored - CO₂e_Counterfactual - CO₂e_Emissions
```

Where:
- `CO₂e_Stored` = Carbon stored in biochar × 44.01/12.01
- `CO₂e_Counterfactual` = Baseline emissions without project (Biomass Feedstock Module)
- `CO₂e_Emissions` = All project emissions

### 4.2 Emissions Breakdown
```
CO₂e_Emissions = CO₂e_Establishment + CO₂e_Operations + CO₂e_End-of-life + CO₂e_Leakage
```

### 4.3 System Boundary (Required SSRs)

| Phase | Sources to Include |
|-------|-------------------|
| **Establishment** | Equipment manufacture, transport to site, construction, surveys |
| **Operations** | Feedstock sourcing/transport/processing, pyrolysis, biochar processing/transport/storage, MRV sampling, staff travel |
| **End-of-Life** | Facility deconstruction and disposal |

### 4.4 Emission Factors Required
| Factor | Description | Reference |
|--------|-------------|-----------|
| Fuel emissions | Per fuel type (diesel, etc.) | Energy Use Accounting v1.2 |
| Grid emissions | Regional average | Energy Use Accounting v1.2 |
| Transport emissions | Distance × mass × factor | Transportation v1.1 |
| Embodied emissions | Equipment/materials lifecycle | Embodied Emissions v1.0 |

### 4.5 Co-Product Allocation
If producing co-products (bio-oil, syngas, heat), allocate emissions by:
- Energy content (MJ) ratio, OR
- GHG Accounting Module v1.0 procedures

---

## 5. Sampling Requirements

### 5.1 Method A: Sample Every Batch
- Required until 30 samples collected for a Production Process
- Minimum **3 samples per Production Batch** (from well-mixed aliquot)
- Use mean carbon content in calculations

### 5.2 Method B: Sample Production Process
- After 30-sample baseline established
- Sample minimum **1 in 10** Production Batches
- Use conservative estimate for unsampled batches:

```
C_biochar = μ_CC - σ_CC/√n_samples
```

Where μ = mean carbon content, σ = standard deviation, n = sample count

### 5.3 Carbon Content Calculation

**Per Production Batch:**
```
CO₂e_Stored = C_biochar × m_biochar × 44.01/12.01
```

**For Blended Storage Batch:**
```
CO₂e_Stored = Σ(C_biochar,p × m_biochar,p / 100) × 44.01/12.01
```

---

## 6. Monitoring Plan

### 6.1 Feedstock Monitoring
| Parameter | Method | Frequency |
|-----------|--------|-----------|
| Weight | Weighbridge/scale | Daily |
| Moisture | Calibrated probe | Daily |
| Source location | GPS | Daily |
| Transport distance | Logs | Daily |
| Sustainable harvest | Partner audits | Monthly |

### 6.2 Pyrolysis Monitoring
| Parameter | Method | Frequency |
|-----------|--------|-----------|
| Temperature | Inline thermocouples | Continuous (5-min) |
| Residence time | Process control | Continuous |
| Reactor pressure | Calibrated sensor (±2%) | Continuous (1-min) |
| Emissions (CH₄, N₂O, CO, CO₂) | Inline analyzer OR annual testing | Continuous OR Annual |

### 6.3 Biochar Quality
| Parameter | Method | Frequency |
|-----------|--------|-----------|
| Carbon content | ISO 17025 lab (ASTM D5291) | Per batch (Method A) or 1/10 (Method B) |
| H:Corg, O:Corg ratios | Lab analysis | Per sampled batch |
| Pollutants (PAHs, metals) | Lab analysis | Per storage module requirements |

### 6.4 Equipment Calibration
- All scales, sensors, meters: Per manufacturer specs or **annually minimum**
- Traceability to national standards required
- Retain calibration records **5 years minimum**

---

## 7. Project Design Document (PDD) Requirements

### 7.1 Required Sections
1. Project setup
2. Protocol & monitoring
3. Environmental & social safeguards
4. Stakeholder input
5. Pathway specific

### 7.2 Key Documents
| Document | Purpose |
|----------|---------|
| PDD | Project description, methods, safeguards |
| LCA | Lifecycle assessment with component calculations |
| Monitoring Plan | All parameters per Appendix II |
| Risk Assessment | Reversal risk questionnaire |

### 7.3 Environmental & Social Requirements
- Environmental impact assessment (annual)
- Social impact assessment (annual)
- Stakeholder engagement (ongoing, documented)
- Adaptive management plan for deployment pause/stop

---

## 8. Buffer Pool & Risk

### 8.1 Buffer Pool Contribution
| Risk Score | Risk Level | Buffer |
|------------|------------|--------|
| 0 | Very Low | 2% |
| 1-2 | Low | 5% |
| 3-4 | Medium | 7% |
| 5+ | High | 10-20% |

### 8.2 Risk Factors for Biochar
- Organic carbon storage (+1)
- Natural disaster exposure (+1)
- Human-induced reversal risk (up to +2)
- Long monitoring history (-2)
- Documented reversal history (+2)

---

## 9. Uncertainty & Materiality

### 9.1 Sensitivity Analysis
- Required at first verification
- Vary each datapoint by ±20%
- Flag inputs causing >1% change to net CO₂e
- Provide justification for flagged inputs

### 9.2 Materiality Threshold
- **5%** for total omissions, errors, mis-statements

---

## 10. Referenced Modules

| Module | Version | Purpose |
|--------|---------|---------|
| Biochar Storage in Soil Environments | v1.2 | Soil application requirements |
| Biochar Storage in Low Oxygen | v1.0 | Burial requirements |
| Biochar Storage in Built Environment | v1.0 | Construction material requirements |
| Biomass Feedstock Accounting | v1.3 | Feedstock eligibility, counterfactuals |
| GHG Accounting | v1.0 | Emissions accounting standards |
| Energy Use Accounting | v1.2 | Electricity/fuel emission factors |
| Transportation Emissions | v1.1 | Transport emission calculations |
| Embodied Emissions | v1.0 | Equipment/materials lifecycle |

---

## 11. Authoritative References

| Resource | URL |
|----------|-----|
| Isometric Standard | https://registry.isometric.com/standard |
| Biochar Protocol v1.2 | https://registry.isometric.com/protocol/biochar/1.2 |
| Certify Documentation | https://docs.isometric.com/user-guides/certify/introduction |
| Registry Documentation | https://docs.isometric.com/user-guides/registry/introduction |
| Validation & Verification | https://docs.isometric.com/user-guides/certify/validation |
| GHG Statements | https://docs.isometric.com/user-guides/certify/ghg-statement |
| API Reference | https://docs.isometric.com/api-reference/introduction |

---

*Note: Any summary or interpretation in this document is not authoritative. Always refer to the official Isometric documentation for definitive requirements.*
