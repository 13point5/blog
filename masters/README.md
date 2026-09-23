# Full-quality masters

GitHub caps normal files at 100 MB, so each master is stored as byte-exact parts of 90 MB or less. Nothing is re-encoded.

| Video | Length | Size |
|---|---|---|
| `opus-5.5-clay-master.mp4`: Opus 5.5 in Clay (v2), high-quality stop-motion | 2:52 | 401 MB |
| `opus-5.5-stop-motion-master.mp4`: first stop-motion version | 1:44 | 272 MB |

To rebuild them, run this from this folder:

```sh
./join.sh            # or: cat opus-5.5-clay-master.mp4.part* > opus-5.5-clay-master.mp4
```

`join.sh` also checks each file against `SHA256SUMS`. On Windows (cmd): `copy /b opus-5.5-clay-master.mp4.part00+opus-5.5-clay-master.mp4.part01+... opus-5.5-clay-master.mp4`

The Vox-style explainer (41 MB) is under 100 MB, so it's a normal file: `../opus-5.5-video/opus-5.5-explained.mp4`.
