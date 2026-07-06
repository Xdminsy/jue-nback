# Dual n-back references

This directory keeps source papers for deciding default block length, adaptive N rules, and how much weight to give n-back transfer claims.

The currently implemented app rule is documented in [../../training-protocol.md](../../training-protocol.md).

## Verified local PDFs

| File | Reference | Why it matters |
| --- | --- | --- |
| `papers/jaeggi-et-al-2008-improving-fluid-intelligence-with-training-on-working-memory.pdf` | Jaeggi, S. M., Buschkuehl, M., Jonides, J., & Perrig, W. J. (2008). *Improving fluid intelligence with training on working memory*. PNAS. DOI: <https://doi.org/10.1073/pnas.0801268105> | Canonical adaptive dual n-back training paper. Useful for block/session structure and N adjustment rules. |
| `papers/jaeggi-et-al-2011-short-and-long-term-benefits-of-cognitive-training.pdf` | Jaeggi, S. M., Buschkuehl, M., Jonides, J., & Shah, P. (2011). *Short- and long-term benefits of cognitive training*. PNAS. DOI: <https://doi.org/10.1073/pnas.1103228108> | Follow-up training study. Useful for comparing training duration and maintenance effects. |

## Mismatched local PDFs

These files are kept in place but should not be used as evidence for dual n-back training protocol decisions until replaced or renamed.

| File | Extracted title | Note |
| --- | --- | --- |
| `papers/nihms-441902.pdf` | *Mentor Networks in Academic Medicine: Moving Beyond a Dyadic Conception of Mentoring for Junior Faculty Researchers* | Not the Redick et al. working-memory training paper. |
| `papers/soveri-2017-nback-training-meta-analysis.pdf` | *When Emotions Matter: Focusing on Emotion Improves Working Memory Updating in Older Adults* | The filename does not match the PDF content; this is an emotional updating n-back task paper, not the Soveri n-back training meta-analysis. |

## Link-only references

| Reference | Link | Note |
| --- | --- | --- |
| Au, J., Sheehan, E., Tsai, N., Duncan, G. J., Buschkuehl, M., & Jaeggi, S. M. (2015). *Improving fluid intelligence with training on working memory: A meta-analysis*. Psychonomic Bulletin & Review. | <https://doi.org/10.3758/s13423-014-0699-x> | Springer PDF is not stored here because direct download may hit a paywall or non-PDF response. |
| Redick, T. S., Shipstead, Z., Harrison, T. L., et al. (2013). *No evidence of intelligence improvement after working memory training: A randomized, placebo-controlled study*. Journal of Experimental Psychology: General. | <https://doi.org/10.1037/a0029082> | Replacement PDF still needed. |
| Soveri, A., Antfolk, J., Karlsson, L., Salo, B., & Laine, M. (2017). *Working memory training revisited: A multi-level meta-analysis of n-back training studies*. Psychonomic Bulletin & Review. | <https://doi.org/10.3758/s13423-016-1217-0> | Replacement PDF still needed. |

## Protocol extraction notes

- Jaeggi et al. 2008 used dual n-back blocks with `20 + n` trials. Each block had six auditory and six visual targets, with four targets appearing in only one modality and two appearing in both modalities.
- Jaeggi et al. 2008 adjusted N after each block: if the participant made fewer than three mistakes per modality, increase N by 1; if more than five mistakes were made, decrease N by 1; otherwise keep N unchanged.
- Jaeggi et al. 2008 used 20 blocks per training session, about 25 minutes per day.
- Jaeggi et al. 2011 used a child-oriented spatial n-back task, not dual n-back. It used 10 rounds per session, each with `15 + n` trials. N increased after a round with three or fewer errors and decreased after four or more errors per round in three consecutive rounds.
- Compare those paper-backed rules with the current implementation, which uses overall accuracy plus worst-channel accuracy, recall, and false-alarm rate.
- Keep UI copy conservative: these references disagree on far transfer, so the app should describe performance and training history rather than promise intelligence gains.
