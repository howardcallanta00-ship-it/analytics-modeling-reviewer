(window.REVIEWER = window.REVIEWER || { modules: [] }).modules.push({
  id: 'm8', num: 8, title: 'Classification Algorithms', short: 'Classification',
  blurb: 'KNN, Decision Tree and LDA for vendor contracts; confusion matrix, F1, AUC.',
  steps: [1, 2, 3, 4, 5, 6, 7],
  pipelineNote: 'Full pipeline with a 70/15/15 stratified split. The new pieces are at Step 6: class-level metrics (precision, recall, F1), ROC-AUC, and business thresholds on predicted probabilities.',
  thirty: 'Classification predicts a category: here, whether to <span style="color:var(--orange-hi)">Renew</span>, <span style="color:var(--orange-hi)">Negotiate</span> or <span style="color:var(--orange-hi)">Terminate</span> a vendor contract. Judge it class by class, because missing a Terminate is far costlier than missing a Renew.',
  analogy: 'A smoke alarm: overall accuracy can look great because most days there is no fire. What matters is whether it catches the fires (recall) without crying wolf too often (precision).',
  objectives: ['Explain multi-class classification for a business decision.', 'Prepare data, standardize correctly and control leakage.', 'Classify by hand with KNN votes, a tree path and LDA scores.', 'Compute accuracy, precision, recall and F1 from a confusion matrix.', 'Interpret ROC-AUC, thresholds and macro averages.', 'Recommend a model using metrics and business cost.'],
  lessons: [
    {
      title: 'The vendor contract case', slides: '3–8',
      simple: 'Each year a manufacturer decides what to do with each supplier. The model learns from past decisions and suggests one of three actions.',
      body: '<p><strong>Classification</strong> predicts a discrete decision from historical records. A manufacturer reviews supplier contracts each year using quality, delivery, cost and compliance indicators.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Class</th><th>Code</th><th>Meaning</th></tr></thead><tbody><tr><td><b>Renew</b></td><td>0</td><td>Meets performance and strategic requirements</td></tr><tr><td><b>Negotiate</b></td><td>1</td><td>Viable but needs corrective commitments, revised price or service levels</td></tr><tr><td><b>Terminate</b></td><td>2</td><td>Unacceptable quality, business or continuity risk</td></tr></tbody></table></div>' +
        '<p>With three outcomes this is <strong>multi-class</strong> classification. Target: <code>Contract_Action</code>, the action decided after each annual review.</p>' +
        '<div class="example"><span class="eyebrow">Model output for vendor V-203</span><p>Renew 0.18 · <b>Negotiate 0.67</b> · Terminate 0.15 → recommended review action: <b>Negotiate</b>.</p></div>' +
        '<p>The model helps procurement prioritize reviews and document consistent evidence. It supports, and does not replace, contract managers, quality engineers and legal review.</p>'
    },
    {
      title: 'Features, preparation and leakage', slides: '9–16',
      body: '<p>Candidate inputs: defect rate, on-time delivery %, purchase-order value, lead-time variability, quality incidents, contract compliance score, price variance. <strong>Use only data known before the next contract decision.</strong></p>' +
        '<div class="tablebox"><table><thead><tr><th>Check</th><th>Example problem</th><th>Action</th></tr></thead><tbody><tr><td>Missing values</td><td>No on-time delivery rate</td><td>Confirm source or impute</td></tr><tr><td>Duplicate records</td><td>Vendor-period appears twice</td><td>Keep the verified record</td></tr><tr><td>Invalid value</td><td>Defect rate = −2%</td><td>Correct or set to missing</td></tr><tr><td>Inconsistent unit</td><td>0.92 and 92%</td><td>Convert to one scale</td></tr><tr><td>Inconsistent target</td><td>Renew, R, Yes</td><td>Standardize to three classes</td></tr><tr><td><b>Leakage</b></td><td>Final legal decision as a feature</td><td>Remove it</td></tr><tr><td>Information timing</td><td>Post-review audit score</td><td>Use pre-review evidence</td></tr><tr><td>Sensitive fields</td><td>Personal evaluator notes</td><td>Exclude unless approved</td></tr></tbody></table></div>' +
        '<p>Set a <strong>decision cutoff date</strong> and exclude anything recorded after it.</p>',
      exam: '<b>Data leakage</b>: training features include information unavailable when the real decision is made (the final contract action, a later termination notice, a post-review audit). The model looks brilliant in testing and fails in use.'
    },
    {
      title: 'Encoding, scaling and class balance', slides: '17–21',
      body: '<p>One-hot encode categories (Material_Category = Electronics → Category_Electronics = 1; Vendor_Region = Luzon → Region_Luzon = 1); binary-encode yes/no (ISO_Certified = 1). <strong>KNN and LDA</strong> benefit from standardized numbers; trees don’t need scaling.</p>' +
        '<div class="formula"><span class="eyebrow">Standardization</span><div class="f">z = (x − μ) ÷ σ</div><div style="font-size:.95rem">On-time delivery 86%, training mean 90%, SD 6% → z = (86 − 90) ÷ 6 = <b>−0.67</b>. <b>Compute μ and σ from training data only.</b></div></div>' +
        '<p><strong>Class imbalance:</strong> Renew 60%, Negotiate 28%, Terminate 12%. Use <strong>stratified splitting</strong> (each set keeps these proportions) and report <strong>class-level</strong> precision, recall and F1.</p>',
      exam: 'Computing the mean and SD on all the data (including test) leaks information about the test set into training. Fit the scaler on training data, then apply it to validation and test, which is exactly what an sklearn Pipeline does.'
    },
    {
      title: 'Exploring, splitting and the baseline', slides: '22–28',
      body: '<p>Review the action distribution by supplier category, defect range, delivery range and compliance. Findings suggest candidate features; they don’t prove causation.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Finding</th><th>Result</th><th>Reading</th></tr></thead><tbody><tr><td>Defect rate vs incidents</td><td>r = 0.71</td><td>More defects coincide with incidents</td></tr><tr><td>Delivery vs lead variation</td><td>r = −0.63</td><td>Unstable lead time, lower delivery</td></tr><tr><td>Compliance by action</td><td>Renew 94%, Negotiate 78%, Terminate 61%</td><td>Compliance separates the classes</td></tr></tbody></table></div>' +
        '<div class="tablebox"><table><thead><tr><th>Portion</th><th>Size</th><th>Use</th></tr></thead><tbody><tr><td>Training 70%</td><td>1,400 reviews</td><td>Fit KNN, Tree, LDA</td></tr><tr><td>Validation 15%</td><td>300</td><td>Select k and tree depth</td></tr><tr><td>Test 15%</td><td>300</td><td>Report metrics once</td></tr></tbody></table></div>' +
        '<p><strong>Baseline:</strong> always predict the most common class. Renew is 60% of reviews, so "Renew for everyone" scores 60% accuracy while never catching a single Terminate. Models must beat it on class-sensitive measures and business cost.</p>'
    },
    {
      title: 'K-Nearest Neighbors classifier', slides: '29–33, 45',
      simple: 'Find the k past vendors most like this one and take a vote.',
      body: '<p>KNN compares a new vendor with similar historical vendors and assigns the <strong>most common class among the k nearest</strong>. Distance needs scaled features.</p>' +
        '<div class="example"><span class="eyebrow">Vendor V-203</span><p>Defect 3.8% (z 0.73), on-time 86% (z −0.62), incidents 4 (z 0.48), compliance 82% (z −0.41), lead variation 2.7 d (z 0.39).</p>' +
        '<div class="tablebox"><table><thead><tr><th>Neighbor</th><th>Distance</th><th>Class</th></tr></thead><tbody><tr><td>H-014</td><td>0.42</td><td>Negotiate</td></tr><tr><td>H-087</td><td>0.55</td><td>Negotiate</td></tr><tr><td>H-132</td><td>0.61</td><td>Renew</td></tr><tr><td>H-219</td><td>0.70</td><td>Negotiate</td></tr></tbody></table></div>' +
        '<p>k = 3 → votes Renew 1, Negotiate 2, Terminate 0 → <b>Negotiate</b>. Probabilities from neighbor shares: Renew 33%, Negotiate 67%, Terminate 0%.</p></div>',
      exam: 'With k = 4 here, the votes would be Negotiate 3, Renew 1 (75% Negotiate). Even k values can tie in two-class problems, which is why odd k is often used.',
      code: [{ t: 'KNN pipeline (slide 45)', c: 'from sklearn.neighbors import KNeighborsClassifier\nknn = Pipeline([("scale", StandardScaler()),\n                ("model", KNeighborsClassifier(n_neighbors=3))])\nknn.fit(X_train, y_train)\nknn.predict_proba(X_new)' }]
    },
    {
      title: 'Decision tree classifier', slides: '34–38',
      body: '<p>A classification tree splits vendors by feature thresholds into increasingly pure groups and predicts the <strong>majority class in the leaf</strong>.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Feature</th><th>V-203</th><th>Candidate split</th><th>Flags</th></tr></thead><tbody><tr><td>Defect rate</td><td>3.8%</td><td>≥ 6%?</td><td>Serious quality risk</td></tr><tr><td>On-time delivery</td><td>86%</td><td>&lt; 85%?</td><td>Delivery concern</td></tr><tr><td>Incidents</td><td>4</td><td>≥ 5?</td><td>Repeated failures</td></tr><tr><td>Compliance</td><td>82%</td><td>&lt; 75%?</td><td>Control risk</td></tr><tr><td>Lead variation</td><td>2.7 d</td><td>≥ 4 d?</td><td>Delivery stability</td></tr></tbody></table></div>' +
        '<div class="formula"><span class="eyebrow">Rule for V-203 (slide 38)</span><div style="font-size:1rem"><b>IF</b> defect rate &lt; 6% <b>AND</b> on-time delivery ≥ 85% <b>AND</b> quality incidents ≥ 3 <b>THEN</b> Negotiate.</div></div>' +
        '<p>Action: inspect quality-corrective actions before final renewal. Trees give explicit rules managers can read; tune depth to avoid overfitting.</p>',
      exam: 'Classification trees typically choose splits that reduce impurity (Gini or entropy), the classification counterpart of the MSE criterion used by regression trees in M7.'
    },
    {
      title: 'Linear Discriminant Analysis', slides: '39–43',
      simple: 'LDA learns what a typical Renew, Negotiate and Terminate vendor looks like, then scores the new vendor against each and picks the best match.',
      body: '<p><strong>LDA</strong> models each class by its <strong>mean feature profile</strong> and a <strong>shared covariance structure</strong>, then forms <strong>linear boundaries</strong> between classes. It works best when features have reasonably similar distributions within classes.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Class mean</th><th>Renew</th><th>Negotiate</th><th>Terminate</th></tr></thead><tbody><tr><td>Defect rate</td><td>1.1%</td><td>4.2%</td><td>8.7%</td></tr><tr><td>On-time delivery</td><td>96%</td><td>84%</td><td>71%</td></tr><tr><td>Quality incidents</td><td>0.8</td><td>4.1</td><td>8.5</td></tr><tr><td>Compliance</td><td>94%</td><td>79%</td><td>60%</td></tr></tbody></table></div>' +
        '<div class="example"><span class="eyebrow">Scoring V-203</span><p>Discriminant scores: δ(Renew) = −1.84, <b>δ(Negotiate) = 1.26</b>, δ(Terminate) = −0.72. <b>The largest score wins → Negotiate</b>, with probabilities Renew 0.08, Negotiate 0.79, Terminate 0.13.</p><p>V-203’s defect rate (3.8%) and incidents (4) sit closest to the Negotiate means.</p></div>',
      code: [{ t: 'LDA', c: 'from sklearn.discriminant_analysis import LinearDiscriminantAnalysis\nlda = Pipeline([("scale", StandardScaler()), ("model", LinearDiscriminantAnalysis())])\nlda.fit(X_train, y_train)\nprint(lda.predict_proba(X_new))' }]
    },
    {
      title: 'Confusion matrix, precision, recall, F1', slides: '46–51',
      simple: 'Precision: when the model says Terminate, how often is it right? Recall: of all real Terminates, how many did it catch?',
      body: '<p>A <strong>confusion matrix</strong> compares actual (rows) with predicted (columns) classes. Review each class separately: misclassifying <b>Terminate as Renew</b> is far riskier than Negotiate as Renew.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Actual ↓ / Predicted →</th><th>Renew</th><th>Negotiate</th><th>Terminate</th><th>Total</th></tr></thead><tbody><tr><td><b>Renew</b></td><td><b>163</b></td><td>12</td><td>5</td><td>180</td></tr><tr><td><b>Negotiate</b></td><td>14</td><td><b>57</b></td><td>9</td><td>80</td></tr><tr><td><b>Terminate</b></td><td>3</td><td>7</td><td><b>30</b></td><td>40</td></tr><tr><td>Total</td><td>180</td><td>76</td><td>44</td><td>300</td></tr></tbody></table></div>' +
        '<p style="font-size:.85rem" class="muted">The diagonal and the Terminate row and column match the slides’ calculations; the remaining two off-diagonal cells (12 and 14) are filled in so the table adds up.</p>' +
        '<div class="formula"><span class="eyebrow">Metrics</span><div class="f">Accuracy = correct ÷ all = (163 + 57 + 30) ÷ 300 = 83.3%</div><div class="f">Precision(T) = TP ÷ predicted T = 30 ÷ 44 = 68.2%</div><div class="f">Recall(T) = TP ÷ actual T = 30 ÷ 40 = 75.0%</div><div class="f">F1 = 2·P·R ÷ (P + R) = 0.714</div></div>' +
        '<ul><li>Accuracy summarizes overall performance but can <strong>hide poor Terminate results</strong>.</li><li>Use <strong>precision</strong> when an unnecessary termination review is costly.</li><li>Use <strong>recall</strong> when you must catch high-risk contracts.</li><li>Report <strong>macro F1</strong> (the plain average of the three class F1s) to treat all classes equally.</li></ul>'
    },
    {
      title: 'ROC-AUC, thresholds and explanations', slides: '52–58',
      body: '<p><strong>ROC-AUC</strong> measures how well a model <em>ranks</em> one class above the others (0.5 = random, 1.0 = perfect). For three classes, compute <strong>one-vs-rest</strong> AUC per class and report the <strong>macro average</strong>. A higher AUC means better ranking, not a final decision by itself.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Terminate probability</th><th>Action</th></tr></thead><tbody><tr><td>≥ 0.70</td><td>Immediate quality and legal review</td></tr><tr><td>0.40–0.69</td><td>Review with procurement manager</td></tr><tr><td>&lt; 0.40</td><td>Use the highest predicted class with standard controls</td></tr></tbody></table></div>' +
        '<p><strong>Set thresholds with business owners, not by accuracy alone.</strong> Lowering the Terminate threshold catches more risky vendors (recall ↑) but increases the number specialists must review. Match it to review capacity and the cost of missing a serious issue.</p>' +
        '<p><strong>SHAP</strong> values show how much each feature pushed a prediction toward or away from a class, for one vendor or overall.</p>'
    },
    {
      title: 'Comparing, validating and reporting', slides: '59–69',
      body: '<p>Use <strong>stratified 5-fold cross-validation</strong> so every fold keeps all three classes. KNN (k = 3) fold macro F1: 0.78, 0.81, 0.79, 0.82, 0.80 → average <b>0.80</b>. Repeat for other k, depths and LDA settings.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Model</th><th>Accuracy</th><th>Macro P</th><th>Macro R</th><th>Macro F1</th><th>Review cost</th></tr></thead><tbody><tr><td>KNN</td><td>83.3%</td><td>0.77</td><td>0.75</td><td>0.76</td><td>$38,000</td></tr><tr><td>Decision Tree</td><td>80.7%</td><td>0.73</td><td>0.74</td><td>0.73</td><td>$41,000</td></tr><tr><td><b>LDA</b></td><td><b>84.0%</b></td><td><b>0.79</b></td><td><b>0.77</b></td><td><b>0.78</b></td><td><b>$35,000</b></td></tr><tr><td>Baseline</td><td>60.0%</td><td>0.20</td><td>0.33</td><td>0.25</td><td>$64,000</td></tr></tbody></table></div>' +
        '<p>LDA gives the best balance here. <strong>Select the model that supports the contract decision</strong>, not just the highest accuracy.</p>' +
        '<p><strong>Underfitting</strong>: can’t separate the three actions. <strong>Overfitting</strong>: memorizes training details and drops on validation/test. Track all three sets during tuning.</p>' +
        '<h4>Interpretation</h4><p>KNN: inspect nearest vendors. Tree: split rules and leaf class mix. LDA: class means, coefficients, probabilities. Combine with supplier strategy, legal obligations and human judgment.</p>' +
        '<h4>Report</h4><p>Business question, review period, target definition, sources, preprocessing, split strategy, selected model, class-level metrics, confusion matrix, validation results, limitations, suggested actions. Historical decisions may contain bias or inconsistency; procurement leaders approve the final action.</p>'
    }
  ],
  traps: [
    { errata: true, slide: 'slides 19–20', title: 'z = −0.62 or −0.67 for 86% on-time delivery?', text: 'Slide 19 lists z = −0.62; slide 20 computes (86 − 90) ÷ 6 = <strong>−0.67</strong>. The calculation is right; the table value is inconsistent.' },
    { errata: true, slide: 'slide 44', title: 'A churn example appears in the vendor deck', text: '"Python Model Development" shows monthly charges, tenure and support calls, telecom churn features that have nothing to do with vendors. Ignore it; the vendor features are defect rate, delivery, incidents, compliance, lead variation.' },
    { title: 'Accuracy hides the rare class', text: 'Always predicting Renew gives 60% accuracy and 0% recall for Terminate. Check per-class recall and macro F1.' },
    { title: 'Precision vs recall', text: '<strong>Precision</strong> divides by the predicted column total (how trustworthy the alarm is). <strong>Recall</strong> divides by the actual row total (how many real cases you caught).' },
    { title: 'Scale with training statistics only', text: 'μ and σ come from the training set and are reused on validation and test. Otherwise test information leaks in.' },
    { title: 'Leakage in contract data', text: 'The final legal decision, a post-review audit or a later termination notice cannot be features.' },
    { title: 'LDA picks the LARGEST discriminant score', text: 'δ(Negotiate) = 1.26 beats −0.72 and −1.84. Don’t pick the score closest to zero.' }
  ],
  quiz: [
    { type: 'num', topic: 'Metrics', q: 'Correct predictions on the diagonal are 163, 57 and 30 out of 300. Accuracy (%)? (one decimal)', answer: 83.3, tol: 0.05, unit: '%', explain: '250 ÷ 300 = 83.3%.' },
    { type: 'num', topic: 'Metrics', q: 'Predicted Terminate column: 5 (actual Renew), 9 (actual Negotiate), 30 (actual Terminate). Precision for Terminate (%)? (one decimal)', answer: 68.2, tol: 0.05, unit: '%', explain: '30 ÷ 44 = 68.2%.' },
    { type: 'num', topic: 'Metrics', q: 'Actual Terminate row: 3 predicted Renew, 7 predicted Negotiate, 30 predicted Terminate. Recall for Terminate (%)?', answer: 75, tol: 0.05, unit: '%', explain: '30 ÷ 40 = 75%.' },
    { type: 'num', topic: 'Metrics', q: 'Precision 0.682 and recall 0.750. F1? (three decimals)', answer: 0.714, tol: 0.002, explain: '2 × 0.682 × 0.750 ÷ 1.432 = 0.714.' },
    { type: 'mcq', topic: 'Metrics', q: 'The business must not miss high-risk vendors. Which metric for Terminate matters most?', options: ['Precision', 'Recall', 'Overall accuracy', 'Training accuracy'], answer: 1, why: ['Precision matters when false alarms are costly.', 'Correct: recall measures how many actual Terminates are caught.', 'Accuracy can hide poor results for the rare class.', 'Training accuracy says nothing about new vendors.'] },
    { type: 'num', topic: 'Scaling', q: 'On-time delivery 86%, training mean 90%, SD 6%. z-score? (two decimals)', answer: -0.67, tol: 0.01, explain: '(86 − 90) ÷ 6 = −0.67.' },
    { type: 'mcq', topic: 'KNN', q: 'V-203’s 3 nearest neighbors are Negotiate, Negotiate, Renew. KNN predicts…', options: ['Renew', 'Negotiate', 'Terminate', 'A tie'], answer: 1, why: ['Renew has 1 vote.', 'Correct: 2 of 3 votes.', 'Terminate has 0 votes.', 'There is no tie with 3 neighbors here.'] },
    { type: 'mcq', topic: 'LDA', q: 'Discriminant scores: Renew −1.84, Negotiate 1.26, Terminate −0.72. LDA predicts…', options: ['Renew', 'Negotiate', 'Terminate', 'The score closest to 0'], answer: 1, why: ['Lowest score.', 'Correct: the largest discriminant score wins.', 'Second-highest.', 'LDA picks the maximum, not the one closest to zero.'] },
    { type: 'mcq', topic: 'LDA', q: 'Which describes LDA?', options: ['Votes among nearest neighbors', 'If-then splits into leaves', 'Class mean profiles with a shared covariance, forming linear boundaries', 'Clusters records without labels'], answer: 2, why: ['That is KNN.', 'That is a decision tree.', 'Correct.', 'That is clustering.'] },
    { type: 'mcq', topic: 'Decision tree', q: 'Rule: IF defect < 6% AND on-time ≥ 85% AND incidents ≥ 3 THEN Negotiate. A vendor has defect 3.8%, on-time 86%, 4 incidents. Prediction?', options: ['Renew', 'Negotiate', 'Terminate', 'Not covered by the rule'], answer: 1, why: ['All three conditions hold, which points to Negotiate.', 'Correct: 3.8 < 6, 86 ≥ 85, 4 ≥ 3.', 'Defects are below the 6% risk split.', 'Every condition is met.'] },
    { type: 'mcq', topic: 'Leakage', q: 'Which feature causes leakage?', options: ['Historical defect rate', 'On-time delivery before the review', 'The final legal decision on the contract', 'Compliance score from the prior period'], answer: 2, why: ['Known before the decision.', 'Known before the decision.', 'Correct: it is the outcome, recorded after the decision.', 'Known before the decision.'] },
    { type: 'mcq', topic: 'Baseline', q: 'Renew is 60% of reviews. The "always Renew" baseline has accuracy 60%. What is its recall for Terminate?', options: ['60%', '33%', '0%', '100%'], answer: 2, why: ['That is overall accuracy.', 'That is its macro recall.', 'Correct: it never predicts Terminate.', 'That is its recall for Renew.'] },
    { type: 'mcq', topic: 'Validation', q: 'Why use stratified cross-validation here?', options: ['To make training faster', 'So every fold keeps all three classes in their proportions', 'To remove the need for a test set', 'To increase accuracy automatically'], answer: 1, why: ['Speed isn’t the reason.', 'Correct: Terminate is only 12%, so random folds could miss it.', 'You still report on a test set.', 'It gives fairer estimates, not higher scores.'] },
    { type: 'mcq', topic: 'Thresholds', q: 'Lowering the Terminate probability threshold from 0.70 to 0.40 will most likely…', options: ['Reduce review volume and recall', 'Catch more risky vendors but increase review volume', 'Change nothing', 'Raise precision and lower recall'], answer: 1, why: ['The opposite.', 'Correct: more vendors get flagged.', 'More vendors cross a lower bar.', 'Lower thresholds usually raise recall and lower precision.'] },
    { type: 'mcq', topic: 'AUC', q: 'For three classes, ROC-AUC is reported as…', options: ['One AUC for the whole matrix', 'One-vs-rest AUC per class, then the macro average', 'Accuracy × 2', 'Only the AUC of the majority class'], answer: 1, why: ['ROC curves are binary, so each class is compared against the rest.', 'Correct.', 'There is no such formula.', 'All classes are included.'] },
    { type: 'tf', topic: 'Metrics', q: 'Macro F1 treats Renew, Negotiate and Terminate equally, even though Terminate is the rarest class.', answer: 0, explain: 'True. It is the plain average of each class’s F1.' }
  ],
  cards: [
    ['Precision formula?', 'TP ÷ (TP + FP): of predicted positives, how many were right.', 'Divide by the predicted column.'],
    ['Recall formula?', 'TP ÷ (TP + FN): of actual positives, how many were caught.', 'Divide by the actual row.'],
    ['F1 formula?', '2 × P × R ÷ (P + R)', 'Harmonic mean of precision and recall.'],
    ['Macro F1?', 'The plain average of the per-class F1 scores.', 'Treats every class equally.'],
    ['Why not just accuracy?', 'It can hide poor results on rare but costly classes like Terminate.', ''],
    ['KNN classification rule?', 'Majority vote of the k nearest neighbors.', ''],
    ['LDA in one line?', 'Class means + shared covariance → linear boundaries; pick the largest discriminant score.', ''],
    ['What is data leakage?', 'Using information not available at the time the real decision is made.', ''],
    ['Multi-class ROC-AUC?', 'One-vs-rest AUC per class, then macro average.', ''],
    ['Best model in M8 example?', 'LDA: accuracy 84%, macro F1 0.78, lowest review cost $35,000.', '']
  ],
  cheat: '<div class="card stack"><h3>Classes</h3><p>Renew 0 · Negotiate 1 · Terminate 2. Imbalance 60 / 28 / 12 → stratify.</p></div>' +
    '<div class="card stack"><h3>Models</h3><p><b>KNN</b>: scale, k nearest, majority vote<br><b>Tree</b>: threshold splits, leaf majority, explicit rules<br><b>LDA</b>: class means + shared covariance, max δ wins</p></div>' +
    '<div class="card stack"><h3>Metrics</h3><p>Accuracy = diag ÷ total = 83.3%<br>Precision = TP ÷ column = 30/44 = 68.2%<br>Recall = TP ÷ row = 30/40 = 75%<br>F1 = 2PR ÷ (P+R) = 0.714</p></div>' +
    '<div class="card stack"><h3>AUC & thresholds</h3><p>AUC: ranking quality, one-vs-rest, macro. Terminate ≥0.70 legal review · 0.40–0.69 manager · &lt;0.40 standard.</p></div>' +
    '<div class="card stack"><h3>Leakage</h3><p>No final decisions, post-review audits or later notices. Scale with training μ, σ only.</p></div>' +
    '<div class="card stack"><h3>Comparison</h3><p>LDA 84.0% · F1 0.78 · $35k ★<br>KNN 83.3% · 0.76 · $38k<br>Tree 80.7% · 0.73 · $41k<br>Baseline 60% · 0.25 · $64k</p></div>'
});
