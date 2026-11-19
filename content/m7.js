(window.REVIEWER = window.REVIEWER || { modules: [] }).modules.push({
  id: 'm7', num: 7, title: 'Regression Algorithms', short: 'Reg. Algorithms',
  blurb: 'KNN Regressor, Decision Tree Regressor and SVR for retail demand.',
  steps: [1, 2, 3, 4, 5, 6, 7],
  pipelineNote: 'Full pipeline with a 60/20/20 split: train fits the models, validation tunes k, tree depth and SVR settings, and test is touched once for the final error.',
  thirty: 'Three ways to predict a number: <mark>KNN</mark> averages the most similar past days, a <mark>decision tree</mark> follows if-then splits to a leaf average, and <mark>SVR</mark> fits a smooth curve that ignores small errors inside a margin.',
  analogy: 'Forecasting tomorrow’s drink sales: KNN asks "what happened on days like this?", a tree asks "is there a promo? is traffic high?", and SVR draws the best smooth trend with some wiggle room.',
  objectives: ['Explain how KNN, Decision Tree and SVR predict a continuous value.', 'Prepare data: target, inputs available in time, encoding and scaling per model.', 'Compute a KNN prediction and follow a tree path by hand.', 'Explain epsilon, C, kernel and gamma in SVR.', 'Compare models with MAE, RMSE and R² on validation data and pick one for the business.', 'Recognize overfitting, leakage and model limitations.'],
  lessons: [
    {
      title: 'Predicting a number: the BayanMart case', slides: '3–11',
      simple: 'Regression predicts amounts (185 units). Classification predicts labels (Churn or Stay). Same process, different algorithms and metrics.',
      body: '<p><strong>BayanMart</strong> needs a daily estimate of units sold for a bottled drink at each branch, so inventory can schedule replenishment and avoid lost sales or excess stock. Users: merchandisers (allocation), store managers (shelf stock), supply planners (deliveries).</p>' +
        '<p><strong>Regression</strong> predicts a numeric value. <strong>Classification</strong> predicts a category. The modeling process is the same: define the decision and target → prepare branch-day data → train and tune candidates → compare on unseen data → report limits and a recommendation.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Role</th><th>Variable</th><th>Type</th><th>Example</th><th>Known before the day?</th></tr></thead><tbody><tr><td><b>Target</b></td><td>Daily_Units_Sold</td><td>Numeric</td><td>185</td><td>No (it’s what we predict)</td></tr><tr><td>Input</td><td>Unit_Price</td><td>Numeric</td><td>₱42.00</td><td>Yes</td></tr><tr><td>Input</td><td>Promotion_Flag</td><td>Binary</td><td>1</td><td>Yes</td></tr><tr><td>Input</td><td>Foot_Traffic</td><td>Numeric</td><td>1,250</td><td>Yes (expected)</td></tr><tr><td>Input</td><td>Day_of_Week</td><td>Categorical</td><td>Saturday</td><td>Yes</td></tr><tr><td>Input</td><td>Rainfall_mm</td><td>Numeric</td><td>8.5</td><td>Yes (forecast)</td></tr><tr><td>Input</td><td>Competitor_Price</td><td>Numeric</td><td>₱45.00</td><td>Yes</td></tr><tr><td>Input</td><td>Branch_Type</td><td>Categorical</td><td>Mall</td><td>Yes</td></tr></tbody></table></div>' +
        '<p><strong>Every input must be available before the sales day ends.</strong> Remove anything created after the outcome (like the final daily sales total).</p>'
    },
    {
      title: 'Preparing the data per model', slides: '12–17',
      body: '<p>Quality checks: missing prices, duplicate branch-day records, impossible negative sales, inconsistent promotion codes, one product definition across branches.</p>' +
        '<p><strong>One-hot encode</strong> Day_of_Week (7 columns: Saturday → 0,0,0,0,0,1,0) and Branch_Type (Mall, Standalone, Neighborhood).</p>' +
        '<div class="example"><span class="eyebrow">Standardizing (slide 16)</span><div class="tablebox"><table><thead><tr><th>Feature</th><th>Value</th><th>Mean</th><th>SD</th><th>z</th></tr></thead><tbody><tr><td>Unit price</td><td>₱42</td><td>₱40</td><td>₱4</td><td>0.50</td></tr><tr><td>Foot traffic</td><td>1,250</td><td>1,000</td><td>200</td><td>1.25</td></tr><tr><td>Rainfall</td><td>8.5 mm</td><td>5.0</td><td>2.5</td><td>1.40</td></tr><tr><td>Competitor price</td><td>₱45</td><td>₱43</td><td>₱2</td><td>1.00</td></tr></tbody></table></div></div>' +
        '<div class="tablebox"><table><thead><tr><th>Model</th><th>Encode categories?</th><th>Standardize numbers?</th><th>Why</th></tr></thead><tbody><tr><td>KNN Regressor</td><td>Yes</td><td><b>Yes</b></td><td>Uses distance to find similar days</td></tr><tr><td>SVR</td><td>Yes</td><td><b>Yes</b></td><td>Distances and margins depend on scale</td></tr><tr><td>Decision Tree</td><td>Yes</td><td><b>No</b></td><td>Split rules compare values; scale doesn’t matter</td></tr></tbody></table></div>'
    },
    {
      title: 'Exploring, splitting and measuring', slides: '18–24, 62',
      body: '<p>Explore: the distribution of units sold; demand by promotion, weekday, price range and branch type; unusual days that could sway estimates. Scatterplots show how price, traffic and promotion relate to units sold; correlation reveals redundant features. A relationship supports prediction but doesn’t prove cause.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Portion</th><th>Records</th><th>Purpose</th></tr></thead><tbody><tr><td>Training</td><td>2,400 (60%)</td><td>Fit model parameters</td></tr><tr><td>Validation</td><td>800 (20%)</td><td>Choose k, tree depth, SVR settings</td></tr><tr><td>Test</td><td>800 (20%)</td><td>Report final generalization error</td></tr></tbody></table></div>' +
        '<div class="formula"><span class="eyebrow">Metrics</span><div class="f">MAE = mean |y − ŷ| · RMSE = √mean (y − ŷ)² · R²</div><div style="font-size:.9rem">Lower MAE and RMSE are better; higher R² is better.</div></div>' +
        '<p><strong>Baseline:</strong> predict the average units sold for the same weekday and promotion status. A candidate must beat it before deployment.</p>'
    },
    {
      title: 'KNN Regressor', slides: '26–37',
      simple: 'Find the k past days most like tomorrow and average what they sold.',
      body: '<p>KNN finds the historical branch-days most similar to the new day and <strong>averages their demand</strong>. A new promotion day with similar price and traffic gets a forecast from comparable past days.</p>' +
        '<div class="example"><span class="eyebrow">Distance between two days (slide 31)</span><p>New day (0.50, 1.20, 1.40, 1) vs past day (0.40, 1.00, 1.10, 1) on price, traffic, rainfall, promotion:</p><p>√[(0.10)² + (0.20)² + (0.30)² + 0²] = √0.14 = <b>0.37</b>, so the days are similar.</p></div>' +
        '<ol><li>Standardize numeric features.</li><li>Compute the distance from the new day to every historical day.</li><li>Select the k closest days.</li><li>Average (or distance-weight) their units sold.</li></ol>' +
        '<div class="example"><span class="eyebrow">Prediction with k = 3 (slides 33–34)</span><div class="tablebox"><table><thead><tr><th>Day</th><th>Promo</th><th>Traffic</th><th>Distance</th><th>Units</th></tr></thead><tbody><tr><td>A</td><td>Yes</td><td>1,210</td><td>0.38</td><td>180</td></tr><tr><td>B</td><td>Yes</td><td>1,260</td><td>0.52</td><td>195</td></tr><tr><td>C</td><td>Yes</td><td>1,170</td><td>0.61</td><td>175</td></tr><tr><td>D</td><td>No</td><td>1,230</td><td>1.44</td><td>132</td></tr></tbody></table></div><p>Nearest three: A, B, C → (180 + 195 + 175) ÷ 3 = <b>183.3 units</b>. Day D is far away (no promo) and gets no vote.</p></div>' +
        '<ul><li><strong>Strengths:</strong> handles nonlinear local patterns with no single equation.</li><li><strong>Limits:</strong> slow to predict with many records; needs scaling.</li><li><strong>k</strong> balances sensitivity (small k) against smoothing (large k).</li></ul>',
      exam: 'Distance weighting: weight each neighbor by 1/d. With A, B, C: weights 2.63, 1.92, 1.64 → (180·2.63 + 195·1.92 + 175·1.64) ÷ 6.19 ≈ 183.4. Closer days count more.',
      code: [{ t: 'KNN pipeline (slide 36)', c: 'from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.neighbors import KNeighborsRegressor\nknn = Pipeline([("scale", StandardScaler()),\n                ("model", KNeighborsRegressor(n_neighbors=5, weights="distance"))])\nknn.fit(X_train, y_train)\npred_knn = knn.predict(X_test)' }]
    },
    {
      title: 'Decision Tree Regressor', slides: '38–49',
      simple: 'Ask yes/no questions (Promo? Traffic over 1,150?) until you reach a group of similar days, then predict that group’s average.',
      body: '<p>A regression tree repeatedly <strong>splits the data into groups with similar demand</strong>. Each terminal <strong>leaf stores the average units sold</strong> of its training records; a new day gets its leaf’s average.</p>' +
        '<p><strong>Split quality:</strong> the tree chooses the split that most reduces the within-group <strong>mean squared error</strong> (variation in units sold). Child groups should vary less than the parent.</p>' +
        '<ol><li>Evaluate possible splits on the training data.</li><li>Choose the split that reduces error the most.</li><li>Repeat on each child until a stopping rule applies.</li><li>Predict the average demand in the final leaf.</li></ol>' +
        '<div class="example"><span class="eyebrow">Demand rules (slide 45)</span><div class="tablebox"><table><thead><tr><th>Rule path</th><th>Training records</th><th>Leaf prediction</th></tr></thead><tbody><tr><td>Promotion = No</td><td>1,550</td><td>128 units</td></tr><tr><td>Promotion = Yes and Traffic ≤ 1,150</td><td>710</td><td>168 units</td></tr><tr><td>Promotion = Yes and Traffic &gt; 1,150</td><td>940</td><td>193 units</td></tr></tbody></table></div><p>Promotion day with traffic 1,240 → Yes branch → &gt; 1,150 → <b>193 units</b>. One transparent path from root to leaf.</p></div>' +
        '<ul><li><strong>No scaling needed</strong>; handles numeric and encoded categories, and captures interactions (promotion × high traffic).</li><li><strong>max_depth</strong> and <strong>min_samples_leaf</strong> limit complexity; deep trees memorize training data and overfit. Pruning helps.</li><li><strong>Feature importance</strong> shows which inputs reduced error most. It does not prove causation.</li></ul>',
      code: [{ t: 'Decision tree (slide 47)', c: 'from sklearn.tree import DecisionTreeRegressor\ntree = DecisionTreeRegressor(max_depth=4, min_samples_leaf=30, random_state=42)\ntree.fit(X_train, y_train)\npred_tree = tree.predict(X_test)\nprint(dict(zip(X_train.columns, tree.feature_importances_)))' }]
    },
    {
      title: 'Support Vector Regression', slides: '50–61',
      simple: 'Draw a smooth curve with a tube around it. Points inside the tube are "close enough" and ignored; points outside push the curve.',
      body: '<p>SVR fits a function that keeps most observations <strong>within an acceptable error margin (ε, epsilon)</strong>. Only points near or outside the margin, the <strong>support vectors</strong>, strongly shape the model.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Setting</th><th>What it controls</th></tr></thead><tbody><tr><td><b>epsilon (ε)</b></td><td>Width of the no-penalty tube. Errors inside it are ignored (epsilon-insensitive loss).</td></tr><tr><td><b>C</b></td><td>Penalty for errors outside the tube. High C fits harder (risk of overfitting); low C is smoother.</td></tr><tr><td><b>kernel</b></td><td>Linear = straight trend. RBF = curved patterns (demand rises, then levels off at high traffic).</td></tr><tr><td><b>gamma</b></td><td>How flexible the RBF curve is; higher = wigglier.</td></tr></tbody></table></div>' +
        '<ol><li>Standardize the inputs.</li><li>Select a kernel and initial C, epsilon, gamma.</li><li>Fit the margin-based function.</li><li>Tune flexibility with validation results.</li></ol>' +
        '<div class="example"><span class="eyebrow">SVR output (slide 58)</span><div class="tablebox"><table><thead><tr><th>Condition</th><th>Actual</th><th>SVR</th><th>|Error|</th></tr></thead><tbody><tr><td>Promotion, high traffic</td><td>192</td><td>188</td><td>4</td></tr><tr><td>No promotion, medium traffic</td><td>134</td><td>139</td><td>5</td></tr><tr><td>Promotion, rainy day</td><td>166</td><td>170</td><td>4</td></tr></tbody></table></div><p>Mean absolute error = (4 + 5 + 4) ÷ 3 = <b>4.3 units</b>. SVR gives smooth estimates rather than one leaf or a few neighbors.</p></div>' +
        '<p><strong>Strengths:</strong> accurate smooth nonlinear forecasts on moderate data. <strong>Limits:</strong> needs scaling and careful tuning; slow on very large datasets.</p>',
      code: [{ t: 'SVR pipeline (slide 59)', c: 'from sklearn.svm import SVR\nsvr = Pipeline([("scale", StandardScaler()),\n                ("model", SVR(kernel="rbf", C=20, epsilon=5, gamma="scale"))])\nsvr.fit(X_train, y_train)\npred_svr = svr.predict(X_test)' }]
    },
    {
      title: 'Tuning, cross-validation and choosing', slides: '62–66',
      body: '<div class="tablebox"><table><thead><tr><th>Model</th><th>Settings to test</th><th>Selected</th></tr></thead><tbody><tr><td>KNN</td><td>k, weights, distance metric</td><td>k = 5, distance weights</td></tr><tr><td>Decision Tree</td><td>max_depth, min_samples_leaf</td><td>depth 4, leaf 30</td></tr><tr><td>SVR</td><td>C, epsilon, gamma, kernel</td><td>RBF, C = 20, ε = 5</td></tr></tbody></table></div>' +
        '<p><strong>Grid search</strong> tries combinations using validation or cross-validation. <strong>K-fold cross-validation</strong> repeats fit-and-validate across several partitions of the training data; the average MAE or RMSE is more stable than one split. Use it when history is limited.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Model</th><th>Val. MAE</th><th>Val. RMSE</th><th>Val. R²</th><th>Reading</th></tr></thead><tbody><tr><td>Baseline</td><td>18.6</td><td>24.1</td><td>0.58</td><td>Reference</td></tr><tr><td>KNN</td><td>13.8</td><td>18.9</td><td>0.74</td><td>Strong on similar days</td></tr><tr><td>Decision Tree</td><td>14.5</td><td>20.2</td><td>0.70</td><td>Most transparent rules</td></tr><tr><td><b>SVR</b></td><td><b>12.9</b></td><td><b>17.6</b></td><td><b>0.78</b></td><td>Lowest validation error</td></tr></tbody></table></div>' +
        '<p>Select the model that meets <strong>accuracy, explainability and operational needs</strong>. If managers need to see why, the tree may win despite slightly higher error.</p>',
      code: [{ t: 'Grid search with CV', c: 'from sklearn.model_selection import GridSearchCV\ngrid = GridSearchCV(svr, {"model__C": [5, 20, 50], "model__epsilon": [2, 5, 10]},\n                    cv=5, scoring="neg_mean_absolute_error")\ngrid.fit(X_train, y_train)\nprint(grid.best_params_)' }]
    },
    {
      title: 'Residuals, fit and responsible use', slides: '67–75',
      body: '<p><strong>Residual = actual − predicted.</strong> Residuals should scatter randomly around zero. A pattern suggests missing variables, seasonality or changing demand.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Problem</th><th>Sign</th></tr></thead><tbody><tr><td>Underfit</td><td>High error on both training and test</td></tr><tr><td>Overfit</td><td>Very low training error, worse validation/test error</td></tr></tbody></table></div>' +
        '<p>In the depth example, <strong>depth 4</strong> gives the lowest validation RMSE; deeper trees start to overfit. <strong>Tune complexity on validation results, not test results.</strong></p>' +
        '<h4>Interpreting each model</h4><ul><li>KNN: point to the similar historical days.</li><li>Tree: show the rule path.</li><li>SVR: explain overall patterns through features, kernel settings and sensitivity analysis.</li></ul>' +
        '<h4>Reporting and use</h4><p>"For the coming Saturday, SVR predicts 188 units." Planners can stock slightly above the forecast and combine it with known events (holidays, supply limits, planned promos).</p>' +
        '<h4>Limits and governance</h4><ul><li>History may not cover a new promotion, competitor move, extreme weather or supply disruption.</li><li>A forecast supports judgment; it doesn’t replace accountability. Monitor error and retrain with recent data.</li><li>Protect data, document features, sources, model version and validation, and check whether some branches get systematically worse forecasts.</li></ul>'
    }
  ],
  traps: [
    { errata: true, slide: 'slides 34 & 40', title: '183.3 or 186 units?', text: 'The KNN slide computes (180 + 195 + 175) ÷ 3 = <strong>183.3</strong>, but its speaker notes and the tree input slide mention <strong>186</strong>. For KNN with k = 3, use 183.3. The tree’s leaf for promo + traffic &gt; 1,150 is 193.' },
    { title: 'Which models need scaling?', text: '<strong>KNN and SVR</strong> need standardized numbers (distance/margins). <strong>Decision trees don’t</strong>. All three still need categories encoded.' },
    { title: 'Tune on validation, report on test', text: 'Choosing k or depth by test results leaks the test set into model selection, making the final error look better than it will be.' },
    { title: 'Leakage: inputs must exist before the day ends', text: 'The final daily sales total, or anything recorded after the outcome, cannot be an input.' },
    { title: 'Epsilon vs C', text: 'ε sets how big an error is ignored (tube width). C sets how hard errors outside the tube are punished.' },
    { title: 'Feature importance ≠ causation', text: 'It shows which inputs the tree used to reduce error, not what causes demand.' },
    { title: 'Lowest error isn’t automatically the winner', text: 'The slides pick on accuracy, explainability and operational needs together. A transparent tree may be the right business choice.' }
  ],
  quiz: [
    { type: 'num', topic: 'KNN', q: 'The 3 nearest days sold 180, 195 and 175 units. KNN (k = 3, simple average) predicts? (one decimal)', answer: 183.3, tol: 0.05, unit: 'units', explain: '550 ÷ 3 = 183.3.' },
    { type: 'num', topic: 'KNN', q: 'Standardized differences between two days are 0.10, 0.20, 0.30 and 0. Euclidean distance? (two decimals)', answer: 0.37, tol: 0.01, explain: '√(0.01 + 0.04 + 0.09 + 0) = √0.14 = 0.37.' },
    { type: 'num', topic: 'Scaling', q: 'Foot traffic 1,250; mean 1,000; SD 200. z-score?', answer: 1.25, tol: 0.001, explain: '(1,250 − 1,000) ÷ 200 = 1.25.' },
    { type: 'mcq', topic: 'Scaling', q: 'Which model does NOT require standardized numeric features?', options: ['KNN Regressor', 'Support Vector Regression', 'Decision Tree Regressor', 'All of them require it'], answer: 2, why: ['KNN uses distances.', 'SVR uses distances and margins.', 'Correct: split rules compare values, so scale doesn’t matter.', 'Trees are the exception.'] },
    { type: 'num', topic: 'Decision tree', q: 'Tree rules: Promo = No → 128; Promo = Yes & Traffic ≤ 1,150 → 168; Promo = Yes & Traffic > 1,150 → 193. Predict a promotion day with traffic 1,100.', answer: 168, tol: 0, unit: 'units', explain: 'Promotion = Yes, traffic 1,100 ≤ 1,150 → leaf 168.' },
    { type: 'mcq', topic: 'Decision tree', q: 'How does a regression tree choose a split?', options: ['The split that maximizes accuracy', 'The split that most reduces within-group mean squared error', 'Alphabetical order of features', 'The feature with the largest values'], answer: 1, why: ['Accuracy is a classification measure.', 'Correct: child groups should have less variation in the target.', 'Feature order is irrelevant.', 'Trees are scale-free.'] },
    { type: 'mcq', topic: 'Decision tree', q: 'A tree has near-zero training error but much worse validation error. Best fix?', options: ['Increase max_depth', 'Limit max_depth / raise min_samples_leaf', 'Standardize the inputs', 'Remove the validation set'], answer: 1, why: ['Deeper trees overfit more.', 'Correct: constrain complexity or prune.', 'Scaling doesn’t affect trees.', 'You’d lose your check on overfitting.'] },
    { type: 'mcq', topic: 'SVR', q: 'In SVR, errors smaller than epsilon are…', options: ['Penalized heavily', 'Ignored (inside the tube)', 'Removed from the data', 'Doubled'], answer: 1, why: ['Errors outside the tube are penalized, scaled by C.', 'Correct: epsilon-insensitive loss.', 'The points stay in the data.', 'There is no doubling.'] },
    { type: 'mcq', topic: 'SVR', q: 'Demand rises with foot traffic during promotions but levels off at very high traffic. Which SVR kernel fits better?', options: ['Linear', 'RBF', 'No kernel', 'Any; kernels don’t matter'], answer: 1, why: ['A linear kernel assumes a constant rate.', 'Correct: the radial basis function can bend.', 'SVR always uses some kernel.', 'The kernel sets the shape of the fit.'] },
    { type: 'num', topic: 'SVR', q: 'SVR absolute errors on three days are 4, 5 and 4 units. MAE? (one decimal)', answer: 4.3, tol: 0.05, unit: 'units', explain: '13 ÷ 3 = 4.3.' },
    { type: 'mcq', topic: 'Comparison', q: 'Validation: Baseline MAE 18.6, KNN 13.8, Tree 14.5, SVR 12.9. Which has the lowest error?', options: ['Baseline', 'KNN', 'Decision Tree', 'SVR'], answer: 3, why: ['It’s the reference.', 'Second best.', 'Third, but the most transparent.', 'Correct: 12.9, with R² 0.78.'] },
    { type: 'mcq', topic: 'Process', q: 'Where should you choose k, tree depth and SVR settings?', options: ['On the training set', 'On the validation set (or cross-validation)', 'On the test set', 'Before collecting data'], answer: 1, why: ['Training error rewards overfitting.', 'Correct: validation tunes, test reports.', 'Using the test set for tuning leaks it.', 'You need data to tune.'] },
    { type: 'mcq', topic: 'Leakage', q: 'Which input would cause leakage when predicting Daily_Units_Sold?', options: ['Promotion_Flag', 'Expected foot traffic', 'The final daily sales total', 'Day_of_Week'], answer: 2, why: ['Known in advance.', 'Known (expected) in advance.', 'Correct: it’s created after, and is essentially the outcome.', 'Known in advance.'] },
    { type: 'mcq', topic: 'Concept', q: 'Predicting "185 units sold" is regression; predicting "Churn or Stay" is…', options: ['Also regression', 'Classification', 'Clustering', 'Association'], answer: 1, why: ['Regression predicts numbers.', 'Correct: a category.', 'Clustering has no target.', 'Association finds co-occurring items.'] },
    { type: 'tf', topic: 'KNN', q: 'A larger k in KNN makes predictions smoother but less sensitive to local patterns.', answer: 0, explain: 'True. More neighbors average out more; fewer neighbors react to local detail.' }
  ],
  cards: [
    ['KNN regressor prediction?', 'Average (or distance-weighted average) of the k nearest neighbors’ target values.', ''],
    ['Tree regressor prediction?', 'The average target value in the leaf the record reaches.', ''],
    ['How does a regression tree pick splits?', 'The split that most reduces within-group MSE.', ''],
    ['SVR epsilon?', 'Width of the tube where errors are ignored.', ''],
    ['SVR C?', 'Penalty for errors outside the tube; high C fits harder.', ''],
    ['Linear vs RBF kernel?', 'Linear = straight trend. RBF = curved, nonlinear patterns.', ''],
    ['Which models need scaling?', 'KNN and SVR. Not decision trees.', ''],
    ['Tree complexity controls?', 'max_depth, min_samples_leaf (and pruning).', ''],
    ['Why cross-validation?', 'Averages error over several splits; more stable, useful with limited data.', ''],
    ['Best validation model in M7?', 'SVR: MAE 12.9, RMSE 17.6, R² 0.78.', 'The tree is the most transparent.']
  ],
  cheat: '<div class="card stack"><h3>KNN</h3><p>Scale → distance to every day → k nearest → average. k=3 example: 183.3 units. Small k sensitive, large k smooth.</p></div>' +
    '<div class="card stack"><h3>Decision tree</h3><p>Split to reduce MSE → leaf average. No scaling. Promo & traffic &gt; 1,150 → 193. Control: max_depth, min_samples_leaf.</p></div>' +
    '<div class="card stack"><h3>SVR</h3><p>ε tube (ignore small errors) · C (penalty outside) · kernel (linear / RBF) · gamma (flexibility). Needs scaling.</p></div>' +
    '<div class="card stack"><h3>Scaling table</h3><p>KNN: encode + scale<br>SVR: encode + scale<br>Tree: encode only</p></div>' +
    '<div class="card stack"><h3>Split</h3><p>60% train · 20% validation (tune) · 20% test (report once). K-fold CV with little data.</p></div>' +
    '<div class="card stack"><h3>Results (validation)</h3><p>Baseline 18.6 / 24.1 / 0.58<br>KNN 13.8 / 18.9 / 0.74<br>Tree 14.5 / 20.2 / 0.70<br>SVR 12.9 / 17.6 / 0.78 (MAE / RMSE / R²)</p></div>' +
    '<div class="card stack"><h3>Explain it</h3><p>KNN: similar days · Tree: rule path · SVR: features, kernel, sensitivity</p></div>'
});
