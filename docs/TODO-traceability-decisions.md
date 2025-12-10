# E2E Traceability: Open Questions

These questions need to be decided before implementing full chain-of-custody tracking from feedstock delivery to application.

---

## Question 1: How should material mixing in storage locations be tracked?

When multiple batches enter the same bin/pile and you later draw material out, how do we allocate the source?

| Option | Description |
|--------|-------------|
| **A: Mass-Weighted Average** | Track all inputs. When drawing out, assume proportional mix. Properties calculated as weighted averages. |
| **B: FIFO (First-In-First-Out)** | Track inputs chronologically. When drawing out, assume oldest material exits first. |
| **C: Batch Isolation** | Never mix batches. Each delivery stays separate through entire chain. |

**Decision:** ____________________

---

## Question 2: Can biochar products mix outputs from multiple production runs?

When creating a biochar product, can it come from multiple production runs that were stored in the same pile?

| Option | Description |
|--------|-------------|
| **A: Yes, with proportional tracking** | Multiple production runs can contribute. Track proportions and calculate blended properties. |
| **B: No, 1:1 mapping** | Each biochar product traces to exactly one production run. |

**Decision:** ____________________

---

## Question 3: What is the minimum viable inventory tracking?

How much inventory tracking do we need for storage locations?

| Level | What's Tracked |
|-------|---------------|
| **0 (Current)** | Nothing - storage locations are just labels |
| **1** | Current quantity only (no history) |
| **2** | Transactions (in/out) with source references |
| **3** | Full inventory management (transfers, adjustments, audits) |

**Decision:** ____________________

---

## Question 4: Do locations need GPS beyond current tracking?

Currently we track:
- Facility location
- Storage location names (no GPS)
- Supplier/customer GPS
- Application field GPS

Do we need:
- [ ] GPS coordinates for each storage location within facility?
- [ ] Field/zone divisions within facility?
- [ ] Geo-fencing for application areas?

**Decision:** ____________________

---

## Notes

_Add discussion notes here_
