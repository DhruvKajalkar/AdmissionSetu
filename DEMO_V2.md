# AdmissionSetu V2 judging walkthrough

Use this as the definitive short demo path. It prioritizes the synchronized admission outcome; supporting features get only a brief proof point.

## Reset prerequisite

From any citizen route, select **Reset Demo**, then select **Reset Demo** in the confirmation bar. Expect Aarya to hold AISSMS Computer Engineering, AISSMS to show 2 available demo seats, four active merit-list interests, no VIT offer, disconnected document-provider consent and the initial scholarship profile. Reset does not change saved preferences.

If no top-six preference is marked unsure, prepare it once before recording: open `/preferences`, select **Edit preferences** if the form is confirmed, choose **I'm not sure** for any choice numbered #1–#6, then select **Review preference safety →**. Leave the review on screen or select **Edit order or intent** when ready to continue.

## Hero story

| Step | Route | Exact action | What to show | Expected state and presenter line |
| ---: | --- | --- | --- | --- |
| 1 | `/dashboard` | Open **Dashboard** | Aarya’s synthetic profile, CET/JEE results, current AISSMS Computer Engineering admission, document readiness, financial-aid summary and **Ask about my admission →** | Aarya begins with one unified profile and exactly one current participating admission. |
| 2 | `/explore` | Open **Explore Colleges**; enter `0627137210` in **Search colleges and programmes** | PICT ENTC, its choice code, sanctioned intake, official-data label and historical cutoff context; expand **About this data** or **View institute details** only if time allows | Real public reference data helps a student make a decision; Aarya’s state remains clearly synthetic. |
| 3 | `/preferences` | Open **My Preferences**; if needed select **Edit preferences**, mark a #1–#6 choice **I'm not sure**, then select **Review preference safety →** | The CAP Round III first-six auto-freeze rule, **Caution**, and plain-language consequence | AdmissionSetu prevents a preference-order mistake before confirmation; it does not recommend a college. |
| 4 | `/spot-rounds` | Open **Spot Rounds**, then select **Open prototype operations view** | Aarya’s starting merit positions: PICT #4, VIT #3, PCCOE #2 and MMCOE #6 | One declared-interest network creates synchronized, transparent merit lists. |
| 5 | `/operations` | No state-changing action yet | **Prototype operations view**, the authority/institution framing, shared seat records, merit queues and offer status | Students and operators are looking at the same central clearing state, not separate lists. |
| 6 | `/documents` | Open **My Documents**, select **Connect DigiLocker**, review the scopes, then select **Allow selected documents** | Simulated consent, the reusable verified records, missing Income Certificate and activity history | One verified document set can be reused with explicit student consent; no real DigiLocker call occurs. |
| 7 | `/spot-rounds` | Select **Make VIT seat offerable**, then **Review seat offer** | Aarya moves from VIT #3 to #1; an exact VIT Computer Engineering seat is offered; current AISSMS and reporting readiness are visible | The deterministic event removes two higher-ranked candidates who confirmed elsewhere and recomputes the list. |
| 8 | `/spot-rounds/spot-vit-computer-live` | Select **Accept VIT seat**; in the dialog select **Confirm and accept seat** | The success state: VIT becomes current, AISSMS release 2 → 3, three competing lists close, and PICT/PCCOE/MMCOE candidates below Aarya move up | One acceptance synchronizes the candidate, exact seats, every competing queue and downstream offers. |
| 9 | Same route, then `/operations` | Select **View synchronized operations** | The released AISSMS seat immediately generates an offer for Candidate #1219; the seat is now `OFFERED` and therefore the current available count is 2 | The capacity was released exactly once, became available 2 → 3, and was immediately recycled to the next eligible candidate. |
| 10 | `/scholarships` | Open **Scholarships** | Explainable eligible/possibly eligible/not eligible results and document readiness shown separately; do not open an official portal unless needed | The same updated admission profile continues into financial-aid discovery without claiming to submit an application. |
| 11 | `/assistant` | Open **Ask AdmissionSetu**; select **What happens if I accept VIT?** | A context-aware answer, source labels, relevant route actions and the read-only notice | One current context is available through natural language, but the assistant cannot change admission state. |

## Closing proof

Return briefly to `/dashboard` or `/admission` to show VIT as Aarya’s only admission. Reload once to demonstrate device-local persistence. For the next recording, run **Reset Demo** again and confirm the initial AISSMS state is restored without changing the preference list.

Every candidate, admission, live vacancy, queue, offer, deadline, document and scholarship-profile value in this story is synthetic. Institute, programme, code, intake, cutoff and linked policy information is labelled official reference data.
