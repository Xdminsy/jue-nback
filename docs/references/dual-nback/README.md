# Dual n-back references

This directory keeps references for deciding default block length, adaptive N rules, and how much weight to give n-back transfer claims.

The currently implemented app rule is documented in [../../training-protocol.md](../../training-protocol.md).

## References

| Reference | Link | Why it matters |
| --- | --- | --- |
| Jaeggi, S. M., Buschkuehl, M., Jonides, J., & Perrig, W. J. (2008). *Improving fluid intelligence with training on working memory*. PNAS. | <https://doi.org/10.1073/pnas.0801268105> | Canonical adaptive dual n-back training paper. Useful for block/session structure and N adjustment rules. |
| Jaeggi, S. M., Buschkuehl, M., Jonides, J., & Shah, P. (2011). *Short- and long-term benefits of cognitive training*. PNAS. | <https://doi.org/10.1073/pnas.1103228108> | Follow-up training study. Useful for comparing training duration and maintenance effects. |
| Au, J., Sheehan, E., Tsai, N., Duncan, G. J., Buschkuehl, M., & Jaeggi, S. M. (2015). *Improving fluid intelligence with training on working memory: A meta-analysis*. Psychonomic Bulletin & Review. | <https://doi.org/10.3758/s13423-014-0699-x> | Meta-analysis for interpreting transfer claims cautiously. |
| Redick, T. S., Shipstead, Z., Harrison, T. L., et al. (2013). *No evidence of intelligence improvement after working memory training: A randomized, placebo-controlled study*. Journal of Experimental Psychology: General. | <https://doi.org/10.1037/a0029082> | Counter-evidence for far-transfer claims. |
| Soveri, A., Antfolk, J., Karlsson, L., Salo, B., & Laine, M. (2017). *Working memory training revisited: A multi-level meta-analysis of n-back training studies*. Psychonomic Bulletin & Review. | <https://doi.org/10.3758/s13423-016-1217-0> | Meta-analysis for broader n-back training effects. |

## Local PDFs

PDFs may be kept under `papers/` for personal reading, but they are ignored by git and should not be committed.

## Protocol extraction notes

- Jaeggi et al. 2008 used dual n-back blocks with `20 + n` trials. Each block had six auditory and six visual targets, with four targets appearing in only one modality and two appearing in both modalities.
- Jaeggi et al. 2008 adjusted N after each block: if the participant made fewer than three mistakes per modality, increase N by 1; if more than five mistakes were made, decrease N by 1; otherwise keep N unchanged.
- Jaeggi et al. 2008 used 20 blocks per training session, about 25 minutes per day.
- Jaeggi et al. 2011 used a child-oriented spatial n-back task, not dual n-back. It used 10 rounds per session, each with `15 + n` trials. N increased after a round with three or fewer errors and decreased after four or more errors per round in three consecutive rounds.
- The current implementation uses the Jaeggi-style block length, fixed target count, and adaptive rule documented in the training protocol, generalized for custom channel combinations.
- Keep UI copy conservative: these references disagree on far transfer, so the app should describe performance and training history rather than promise intelligence gains.
