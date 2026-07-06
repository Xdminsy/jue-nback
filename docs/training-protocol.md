# Training protocol

The default adaptive mode follows a Jaeggi-style dual n-back block protocol, generalized to the app's configurable channels.

## Block length

- One app session is one training block.
- Adaptive blocks use `20 + N` trials.
- The first `N` trials cannot be targets because there is no item `N` steps back to compare with.

## Target generation

- The number of comparable positions in an adaptive block is always 20.
- Each active channel receives `round(20 * matchRate)` targets by default.
- With the default `matchRate` of `0.3`, each active channel receives 6 targets.
- In non-adaptive custom-length sessions, each active channel receives `round((trials - N) * matchRate)` targets.
- For two-channel modes, one third of the targets are shared across both channels when possible. With the default 6 targets, 2 trials are simultaneous targets and 4 additional trials are channel-specific for each channel.
- For one-channel and three-or-more-channel modes, each channel still gets the fixed target count; overlaps are not forced into the Jaeggi dual pattern.
- Non-target trials are generated so their value differs from the value `N` steps back for that channel.

## Adaptive N

At the end of each block, each active channel gets an error count:

```text
errors = misses + false alarms
```

N changes by at most 1:

- Increase N by 1 when every active channel has 2 or fewer errors.
- Decrease N by 1 when any active channel has 6 or more errors.
- Otherwise keep N unchanged.

This intentionally allows N to oscillate around the user's current capacity boundary, such as `2 -> 3 -> 2 -> 3`.

## Source

Jaeggi et al. 2008 used dual n-back blocks with `20 + n` trials, six auditory targets and six visual targets per block, and adaptive difficulty based on mistakes after each block. The app uses that as the default adaptive rule while keeping custom channel combinations available.
