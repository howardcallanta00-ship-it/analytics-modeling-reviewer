(window.REVIEWER = window.REVIEWER || { modules: [] }).modules.push({
  id: 'm3', num: 3, title: 'Introduction to Regression Analysis', short: 'Regression',
  blurb: 'Least squares, correlation, residuals, VIF, R², overfitting.',
  steps: [1, 2, 3, 4, 5, 6, 7],
  pipelineNote: 'Module 3 is the first time the full pipeline appears: define the business question (advertising → sales), prepare and explore, split 80/20, fit candidate models, check assumptions and residuals, assess on test data, and report with limitations.',
  thirty: 'Regression fits a line (or plane) that predicts a number, like sales, from one or more inputs, like advertising spend. You judge it by its errors on new data and by whether its residuals look random.',
  analogy: 'The slope is the "exchange rate" between the input and the output: every extra ₱1,000 of advertising buys about b more units of sales, on average.',
  objectives: ['Explain what regression analysis estimates and predicts.', 'Name the dependent and independent variables in a business problem.', 'Compute a simple linear regression by least squares and use it to predict.', 'Interpret correlation, coefficients, R², MAE and RMSE.', 'Check the assumptions with residual plots and VIF.', 'Recognize overfitting, extrapolation and omitted-variable problems.'],
  lessons: [
    {
      title: 'What regression is and what it is for', slides: '4–12',
      simple: 'Regression learns how one number moves when other numbers change, so you can predict it.',
      body: '<p><strong>Regression analysis</strong> studies how a <strong>dependent variable</strong> depends on one or more <strong>explanatory (independent) variables</strong>, to estimate or predict its average value from known values of the inputs.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Term</th><th>Meaning</th><th>Advertising example</th></tr></thead><tbody><tr><td>Dependent variable (y, response)</td><td>What you predict</td><td>Sales revenue</td></tr><tr><td>Independent variables (x, predictors)</td><td>What you predict from</td><td>TV and radio advertising expense</td></tr><tr><td>Unit of analysis</td><td>What one row is</td><td>One campaign or sales period</td></tr></tbody></table></div>' +
        '<p>Three uses: estimate the average relationship; measure each predictor’s effect while <strong>controlling for the others</strong>; predict y for given x values.</p>' +
        '<p>Regression tells you <strong>how strong the impact</strong> is (R², standardized coefficients) and <strong>which relationships are significant</strong> (p-values). In the blood pressure example, Age (p = 0.002), Sodium (p = 0.015) and Stress (p = 0.041) are significant at 0.05; Shoe Size (p = 0.890) is not.</p>' +
        '<div class="analogy"><strong>Important:</strong> regression estimates an <em>association</em>. It does not prove that advertising alone caused the sales change.</div>'
    },
    {
      title: 'The modeling process', slides: '4, 15–19',
      body: '<ol><li>Define the business problem and the outcome to predict.</li><li>Prepare and inspect the data.</li><li>Explore relationships among variables.</li><li>Split into training and test sets.</li><li>Build and compare regression models.</li><li>Check assumptions and diagnose errors.</li><li>Assess performance on new data.</li><li>Report findings, limitations and recommendations.</li></ol>' +
        '<h4>Data preparation for regression</h4><ul><li>Each row is one consistent observation (one campaign, one month).</li><li>Correct type and unit for each variable (e.g., thousands of dollars).</li><li>Check missing values, duplicates and invalid values.</li><li>Investigate extreme values before removing them.</li><li>Encode categorical predictors.</li><li>Document the source, meaning and unit of every variable.</li></ul>' +
        '<p>Missing data reduces the usable sample size. In small datasets, few observations give poorly estimated models with <strong>large standard errors</strong>.</p>',
      code: [{ t: 'Data quality checks (slide 17)', c: 'print(data.info())\nprint(data.isnull().sum())\nprint("Duplicates:", data.duplicated().sum())\nprint(data.describe())\nprint(data.head())' }]
    },
    {
      title: 'Correlation: direction and strength', slides: '20–24',
      simple: 'Correlation r runs from −1 to +1. Near +1: both go up together. Near −1: one goes up as the other goes down. Near 0: no straight-line link.',
      body: '<p>Before fitting, use scatterplots and a correlation matrix to see whether relationships look linear and which predictors are related to each other.</p>' +
        '<div class="tablebox"><table><thead><tr><th>r</th><th>Meaning</th><th>Example</th></tr></thead><tbody><tr><td>Close to +1</td><td>Strong positive linear relationship</td><td>More study hours, higher scores</td></tr><tr><td>Close to −1</td><td>Strong negative linear relationship</td><td>More missed classes, lower scores</td></tr><tr><td>Close to 0</td><td>No linear relationship</td><td>Shoe size and intelligence</td></tr></tbody></table></div>' +
        '<div class="analogy"><strong>Correlation describes association. It does not establish causation.</strong> Ice cream sales and drownings both rise in summer.</div>',
      exam: 'r only measures <em>linear</em> association. A perfect U-shaped relationship can have r ≈ 0. In simple linear regression, R² = r².',
      code: [{ t: 'Explore relationships (slide 21)', c: 'import seaborn as sns\nsns.pairplot(data, x_vars=["TV", "Radio"], y_vars="Sales", kind="reg", height=4)\nprint(data[["TV", "Radio", "Sales"]].corr())' }]
    },
    {
      title: 'Slope and intercept', slides: '12–14, 25',
      simple: 'The slope is how much y changes for each 1-unit increase in x. The intercept is y when x is zero.',
      body: '<div class="formula"><span class="eyebrow">The line</span><div class="f">ŷ = a + b·x</div><div style="font-size:.95rem">b (slope): change in y per one-unit increase in x. a (intercept): predicted y when x = 0. Some slides write it y = mx + b, with m the slope and b the intercept; same idea.</div></div>' +
        '<div class="example"><span class="eyebrow">Advertising and sales (slides 13–14)</span><p>If slope = 0.76, every 1 unit of advertising money is associated with about 0.76 more units of sales. If intercept = 6.86, sales start at about 6.86 units even with zero advertising.</p></div>'
    },
    {
      title: 'Least squares by hand', slides: '26–32',
      simple: 'Find the means, multiply each x-deviation by its y-deviation and add them up, divide by the sum of squared x-deviations. That’s the slope.',
      body: '<div class="formula"><span class="eyebrow">Least-squares formulas</span><div class="f">b = Σ(x − x̄)(y − ȳ) ÷ Σ(x − x̄)²</div><div class="f">a = ȳ − b·x̄</div></div>' +
        '<div class="example"><span class="eyebrow">Worked example (slides 26–32)</span><p>Points (ad spend, sales): (1000, 8000), (1500, 9500), (2000, 11000), (2500, 12500), (3000, 14000), (3500, 15500), (4000, 17000).</p>' +
        '<ol><li>Means: x̄ = 2500, ȳ = 12500.</li><li>Numerator Σ(x − x̄)(y − ȳ) = 6.75M + 3M + 0.75M + 0 + 0.75M + 3M + 6.75M = <b>21,000,000</b>.</li><li>Denominator Σ(x − x̄)² = 2.25M + 1M + 0.25M + 0 + 0.25M + 1M + 2.25M = <b>7,000,000</b>.</li><li>Slope b = 21,000,000 ÷ 7,000,000 = <b>3</b>.</li><li>Intercept a = 12,500 − 3 × 2,500 = <b>5,000</b>.</li><li>Equation: <b>Sales = 5,000 + 3 × Ad spend</b>.</li><li>Predict at $4,500: 5,000 + 3 × 4,500 = <b>$18,500</b>.</li></ol></div>' +
        '<p>"Least squares" means this line makes the sum of squared vertical errors (residuals) as small as possible.</p>',
      exam: 'Prediction at $4,500 is technically <em>extrapolation</em>: the data only cover $1,000–$4,000. The slides use it as an example; on an exam, mention the risk.'
    },
    {
      title: 'Types of regression and the data split', slides: '34–40',
      body: '<div class="tablebox"><table><thead><tr><th>Type</th><th>Form</th><th>Use</th></tr></thead><tbody><tr><td><strong>Simple linear</strong></td><td>ŷ = a + b·x</td><td>One predictor, straight-line relationship</td></tr><tr><td><strong>Multiple linear</strong></td><td>ŷ = b₀ + b₁x₁ + b₂x₂ + …</td><td>Several predictors (TV and radio); fits a plane</td></tr><tr><td><strong>Nonlinear</strong></td><td>e.g. ŷ = b₀ + b₁x + b₂x², log terms</td><td>Curved relationships such as diminishing returns</td></tr></tbody></table></div>' +
        '<h4>Training, validation and test</h4><div class="tablebox"><table><thead><tr><th>Portion</th><th>Purpose</th></tr></thead><tbody><tr><td>Training</td><td>Fits the model</td></tr><tr><td>Validation</td><td>Compares settings or candidate models</td></tr><tr><td>Test</td><td>Final estimate of performance on new data</td></tr></tbody></table></div>' +
        '<p>For an introductory dataset: <strong>80% training, 20% test</strong>. Start with a <strong>baseline</strong> (predict the average sales), then simple regression (TV), then multiple (TV + radio). Added complexity must improve <em>test</em> performance enough to justify itself.</p>',
      code: [{ t: 'Split and fit', c: 'from sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LinearRegression\ntrain, test = train_test_split(data, test_size=0.20, random_state=42)\nmodel = LinearRegression().fit(train[["TV", "Radio"]], train["Sales"])\nprint(model.intercept_, model.coef_)' }]
    },
    {
      title: 'Assumptions and residual plots', slides: '48–59',
      simple: 'Residual = actual − predicted. A good model leaves residuals that look like random noise around zero.',
      body: '<div class="tablebox"><table><thead><tr><th>Assumption</th><th>Meaning</th><th>How to check</th></tr></thead><tbody><tr><td>Linearity</td><td>Predictors relate linearly to y</td><td>Scatterplot, residual plot</td></tr><tr><td>Independence</td><td>One error does not depend on another</td><td>Study design, residual order plot</td></tr><tr><td>Constant variance</td><td>Residual spread similar across predictions</td><td>Residuals vs fitted values</td></tr><tr><td>Normal residuals</td><td>Residuals roughly normal</td><td>Histogram, Q–Q plot</td></tr><tr><td>Low multicollinearity</td><td>Predictors don’t duplicate each other</td><td>Correlation matrix, VIF</td></tr></tbody></table></div>' +
        '<div class="tablebox"><table><thead><tr><th>Residual pattern</th><th>Diagnosis</th><th>Fix</th></tr></thead><tbody><tr><td>Random, even band around 0</td><td>Assumptions met (homoscedasticity)</td><td>None needed</td></tr><tr><td>U-shape or arch</td><td>Missing a nonlinear relationship</td><td>Add x² or log-transform x</td></tr><tr><td>Fan / cone that widens</td><td><strong>Heteroscedasticity</strong>: error variance not constant</td><td>log(Sales), or Weighted Least Squares</td></tr></tbody></table></div>' +
        '<p>In the 3D plot for TV + radio, the grey plane is the prediction formula; the vertical distance from each dot to the plane is its residual.</p>',
      code: [{ t: 'Residual plot (slide 59)', c: 'residuals = y_test - multiple_pred\nplt.scatter(multiple_pred, residuals)\nplt.axhline(y=0, color="red", linestyle="--")\nplt.xlabel("Predicted Sales"); plt.ylabel("Residuals")\nplt.show()' }]
    },
    {
      title: 'Multicollinearity and VIF', slides: '60–62',
      body: '<p><strong>Multicollinearity</strong>: two or more predictors carry very similar information. Coefficients become unstable, individual effects hard to interpret, and standard errors large.</p>' +
        '<div class="tablebox"><table><thead><tr><th>VIF</th><th>Interpretation</th></tr></thead><tbody><tr><td>About 1</td><td>Very low multicollinearity</td></tr><tr><td>1 to 5</td><td>Usually acceptable</td></tr><tr><td>Above 5</td><td>Investigate the predictors</td></tr><tr><td>Above 10</td><td>Serious concern</td></tr></tbody></table></div>',
      exam: 'VIF for predictor j = 1 ÷ (1 − R²ⱼ), where R²ⱼ comes from regressing predictor j on all the other predictors. R²ⱼ = 0.9 → VIF = 10.',
      code: [{ t: 'VIF (slide 61)', c: 'from statsmodels.stats.outliers_influence import variance_inflation_factor\nX = data[["TV", "Radio"]]\nvif = pd.DataFrame({"Variable": X.columns,\n    "VIF": [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]})' }]
    },
    {
      title: 'Measuring performance: MAE, RMSE, R²', slides: '63–66',
      simple: 'MAE is the typical miss. RMSE punishes big misses more. R² is the share of the variation the model explains.',
      body: '<div class="formula"><span class="eyebrow">Metrics</span><div class="f">MAE = Σ|y − ŷ| ÷ n</div><div class="f">RMSE = √[ Σ(y − ŷ)² ÷ n ]</div><div class="f">R² = 1 − SSE ÷ SST</div><div style="font-size:.9rem">Adjusted R² penalizes predictors that don’t help: it rises only when an added predictor is useful.</div></div>' +
        '<div class="tablebox"><table><thead><tr><th>Model (test set)</th><th>MAE</th><th>RMSE</th><th>R²</th><th>Reading</th></tr></thead><tbody><tr><td>Baseline (mean)</td><td>55.0</td><td>68.2</td><td>0.00</td><td>Guesses the average every time</td></tr><tr><td>TV only</td><td>22.5</td><td>28.1</td><td>0.65</td><td>TV explains 65% of variance</td></tr><tr><td>TV + radio</td><td>14.2</td><td>17.8</td><td>0.88</td><td>Lowest errors: choose this</td></tr></tbody></table></div>' +
        '<p><strong>Decision rule:</strong> pick the model with lower test errors, sensible coefficients, and no serious diagnostic problems. Report performance on the <strong>test</strong> set.</p>',
      exam: 'RMSE ≥ MAE always. A large gap between them signals a few big errors. Plain R² never decreases when you add predictors, which is why Adjusted R² exists.'
    },
    {
      title: 'Overfitting, interpretation and pitfalls', slides: '67–75',
      body: '<div class="tablebox"><table><thead><tr><th>Fit</th><th>Training accuracy</th><th>Test accuracy</th><th>Like a student who…</th></tr></thead><tbody><tr><td>Underfitting</td><td>Low</td><td>Low</td><td>didn’t study enough</td></tr><tr><td>Overfitting</td><td>High</td><td>Low</td><td>memorized the practice test</td></tr><tr><td>Best fit</td><td>High</td><td>High</td><td>studied the concepts</td></tr></tbody></table></div>' +
        '<h4>Reading multiple-regression coefficients</h4><p>Sales = 210 + 3.1·TV + 1.6·Radio. <strong>Holding radio constant</strong>, one more unit of TV spending is associated with 3.1 more units of sales. Always state units (thousands of dollars?).</p>' +
        '<h4>Statistical vs practical significance</h4><p>A tiny p-value says the effect is unlikely to be random; it does not say the effect is big enough to pay for itself. Check ROI too.</p>' +
        '<h4>Pitfalls</h4><ul><li><strong>Excluding important predictors</strong> can change the size and even the sign of a coefficient.</li><li><strong>Extrapolation</strong>: predicting outside the range of x in the data is unreliable.</li><li>Results are associations; pricing, seasonality, competition and quality may be missing.</li></ul>'
    }
  ],
  traps: [
    { errata: true, slide: 'slide 64', title: '“82% of sales shifts are directly driven by TV”', text: 'R² = 0.82 means 82% of the <em>variation</em> in sales is <em>explained by</em> (associated with) the model. It does not mean TV <em>drives</em> or causes it. The same deck warns that regression shows association, not causation.' },
    { errata: true, slide: 'slide 66', title: '“Accuracy hits 88%”', text: 'R² is not accuracy. R² = 0.88 means 88% of variance explained. "Accuracy" belongs to classification (M8).' },
    { title: 'Correlation ≠ causation', text: 'A strong r shows the variables move together. A third factor (season, income) can drive both.' },
    { title: 'Judge on test data, not training data', text: 'A model can look great on the data it was fit on and fail on new data. That gap is overfitting.' },
    { title: 'U-shape vs fan-shape residuals', text: '<strong>U or arch</strong> = missed curvature → add x² or a log. <strong>Fan or cone</strong> = heteroscedasticity → log(y) or WLS.' },
    { title: 'Intercept may be meaningless', text: 'The intercept is y when every x = 0. If x = 0 is far from the data (a house with 0 square feet), don’t interpret it literally.' },
    { title: 'Extrapolation', text: 'The ad data run from $1,000 to $4,000. Predicting at $10,000 assumes the line keeps going, which the data cannot confirm.' }
  ],
  quiz: [
    { type: 'mcq', topic: 'Variables', q: 'A company predicts sales from TV and radio spending. Sales is the…', options: ['Independent variable', 'Dependent variable', 'Predictor', 'Unit of analysis'], answer: 1, why: ['Independent variables are the inputs: TV and radio.', 'Correct: it is the response being predicted.', 'Predictors are the inputs.', 'The unit of analysis is one campaign or period.'] },
    { type: 'num', topic: 'Least squares', q: 'Points: (1000, 8000), (1500, 9500), … (4000, 17000) with Σ(x − x̄)(y − ȳ) = 21,000,000 and Σ(x − x̄)² = 7,000,000. What is the slope?', answer: 3, tol: 0.001, explain: 'b = 21,000,000 ÷ 7,000,000 = 3.' },
    { type: 'num', topic: 'Least squares', q: 'With slope 3, x̄ = 2,500 and ȳ = 12,500, what is the intercept?', answer: 5000, tol: 0.5, explain: 'a = ȳ − b·x̄ = 12,500 − 7,500 = 5,000.' },
    { type: 'num', topic: 'Least squares', q: 'Using Sales = 5,000 + 3 × Ad spend, predict sales for an ad spend of $4,500.', answer: 18500, tol: 0.5, unit: '$', explain: '5,000 + 13,500 = 18,500.' },
    { type: 'mcq', topic: 'Coefficients', q: 'Sales = 210 + 3.1·TV + 1.6·Radio. What does 3.1 mean?', options: ['TV causes a 3.1-unit increase in sales', 'Holding radio constant, one more unit of TV spend is associated with 3.1 more units of sales', 'TV explains 3.1% of sales', 'Sales are 3.1 when TV is zero'], answer: 1, why: ['Regression shows association, not causation.', 'Correct: the coefficient is the effect with other predictors held constant.', 'That would be about R², not a coefficient.', 'That describes the intercept, and it is 210.'] },
    { type: 'mcq', topic: 'Correlation', q: 'r = −0.85 between days absent and test score means…', options: ['A weak negative relationship', 'A strong negative linear relationship', 'Absences cause lower scores', 'No relationship'], answer: 1, why: ['−0.85 is close to −1, so it is strong.', 'Correct: as absences rise, scores tend to fall.', 'Correlation does not establish causation.', 'r near 0 would mean no linear relationship.'] },
    { type: 'mcq', topic: 'Residuals', q: 'The residual plot shows a fan shape: tight at low TV spend, wide at high spend. This is…', options: ['Homoscedasticity', 'Heteroscedasticity', 'Multicollinearity', 'A missing quadratic term'], answer: 1, why: ['Homoscedasticity is an even band.', 'Correct: the error variance grows with x.', 'Multicollinearity is about predictors, checked with VIF.', 'A missing curve shows a U-shape.'] },
    { type: 'mcq', topic: 'Residuals', q: 'Residuals form a clear U-shape. What is the best fix?', options: ['Remove the outliers', 'Add a polynomial term like x² or log-transform x', 'Use Weighted Least Squares', 'Collect more rows'], answer: 1, why: ['The pattern is systematic, not caused by a few points.', 'Correct: the straight line misses the curvature.', 'WLS addresses a fan shape (heteroscedasticity).', 'More rows will not straighten a curve.'] },
    { type: 'mcq', topic: 'Multicollinearity', q: 'A predictor has VIF = 12. What should you conclude?', options: ['Very low multicollinearity', 'Usually acceptable', 'Serious multicollinearity concern', 'The predictor is not significant'], answer: 2, why: ['Low is about 1.', 'Acceptable is 1–5.', 'Correct: above 10 is a serious concern.', 'VIF measures redundancy, not significance.'] },
    { type: 'mcq', topic: 'Metrics', q: 'Which metric gives greater weight to large errors?', options: ['MAE', 'RMSE', 'R²', 'Adjusted R²'], answer: 1, why: ['MAE weighs all errors equally.', 'Correct: squaring makes big errors count more.', 'R² is the share of variance explained.', 'Adjusted R² penalizes extra predictors.'] },
    { type: 'mcq', topic: 'Metrics', q: 'Test results: Baseline RMSE 68.2, TV-only 28.1, TV + radio 17.8 (R² 0.88). Which model do you choose?', options: ['Baseline', 'TV-only', 'TV + radio', 'Cannot tell without the training set'], answer: 2, why: ['The baseline is only a reference point.', 'It improves on the baseline but TV + radio does better.', 'Correct: lowest test errors and highest R², assuming no diagnostic problems.', 'Test-set results are exactly what you should compare.'] },
    { type: 'mcq', topic: 'Overfitting', q: 'Training R² = 0.97, test R² = 0.41. This is…', options: ['Underfitting', 'Overfitting', 'Best fit', 'Multicollinearity'], answer: 1, why: ['Underfitting is poor on both sets.', 'Correct: high on training, poor on new data. It memorized.', 'Best fit is strong on both.', 'Multicollinearity is about redundant predictors.'] },
    { type: 'tf', topic: 'Pitfalls', q: 'Predicting sales at $10,000 of ad spend from data that range from $1,000 to $4,000 is called extrapolation and can be unreliable.', answer: 0, explain: 'True. The relationship may not continue outside the observed range.' },
    { type: 'tf', topic: 'Significance', q: 'A coefficient with p = 0.001 is always large enough to matter for the business.', answer: 1, explain: 'False. Statistical significance is not practical significance. Check the size of the effect and ROI.' },
    { type: 'mcq', topic: 'Significance', q: 'In the blood pressure study, Shoe Size has p = 0.890. At α = 0.05 you…', options: ['Keep it: it is significant', 'Conclude it has no meaningful relationship and can be dropped', 'Conclude it causes high blood pressure', 'Double its coefficient'], answer: 1, why: ['p > 0.05, so it is not significant.', 'Correct: no evidence of a genuine relationship.', 'p-values never establish causation.', 'That has no basis.'] }
  ],
  cards: [
    ['Least-squares slope formula?', 'b = Σ(x − x̄)(y − ȳ) ÷ Σ(x − x̄)²', ''],
    ['Least-squares intercept formula?', 'a = ȳ − b·x̄', ''],
    ['What is a residual?', 'Actual y − predicted ŷ.', 'Residuals should scatter randomly around 0.'],
    ['Five linear regression assumptions?', 'Linearity, independence, constant variance, normal residuals, low multicollinearity.', ''],
    ['Fan-shaped residuals mean?', 'Heteroscedasticity (non-constant error variance).', 'Fix: log(y) or Weighted Least Squares.'],
    ['VIF thresholds?', '~1 low, 1–5 acceptable, >5 investigate, >10 serious.', ''],
    ['MAE vs RMSE?', 'MAE: average absolute error. RMSE: square-rooted mean squared error, punishes large errors more.', ''],
    ['Why Adjusted R²?', 'Plain R² never falls when you add predictors; Adjusted R² only rises if the added predictor helps.', ''],
    ['Overfitting signature?', 'High training performance, low test performance.', ''],
    ['What is extrapolation?', 'Predicting with x values outside the range in the data.', '']
  ],
  cheat: '<div class="card stack"><h3>Line</h3><p>ŷ = a + b·x<br>b = Σ(x−x̄)(y−ȳ) ÷ Σ(x−x̄)²<br>a = ȳ − b·x̄<br>Ad example: Sales = 5,000 + 3·Ad → $4,500 → $18,500</p></div>' +
    '<div class="card stack"><h3>Correlation r</h3><p>−1 strong negative · 0 none · +1 strong positive. Linear only. Not causation.</p></div>' +
    '<div class="card stack"><h3>Assumptions</h3><p>Linearity · Independence · Constant variance · Normal residuals · Low multicollinearity (VIF)</p></div>' +
    '<div class="card stack"><h3>Residual plots</h3><p>Random band → OK<br>U-shape → add x² / log x<br>Fan → heteroscedasticity → log y / WLS</p></div>' +
    '<div class="card stack"><h3>Metrics</h3><p>MAE ↓ · RMSE ↓ (big errors) · R² ↑ · Adj. R² ↑ if predictor helps. Report on <b>test</b>.</p></div>' +
    '<div class="card stack"><h3>VIF</h3><p>≈1 low · 1–5 OK · &gt;5 investigate · &gt;10 serious</p></div>' +
    '<div class="card stack"><h3>Fit</h3><p>Under: low/low · Over: high train, low test · Best: high/high</p></div>' +
    '<div class="card stack"><h3>Pitfalls</h3><p>Causation claims · Omitted predictors · Extrapolation · Stat. vs practical significance</p></div>'
});
