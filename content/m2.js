(window.REVIEWER = window.REVIEWER || { modules: [] }).modules.push({
  id: 'm2', num: 2, title: 'Data Preparation', short: 'Data Prep',
  blurb: 'Missing values, duplicates, outliers, scaling, encoding, integration and binning.',
  steps: [2],
  pipelineNote: 'Data preparation is Step 2, Prepare. Every model later in the course depends on it: KNN, K-means and SVR break without scaling; Apriori breaks with duplicate or inconsistent item names; BERT needs cleaned text.',
  thirty: 'Data preparation turns raw, messy data into a clean, consistent table a model can use: fill or drop missing values, remove duplicates, treat outliers, fix types and labels, encode categories, scale numbers, combine sources and shrink the data when it is too big.',
  analogy: 'It is the washing, peeling and chopping before cooking. Nobody sees it in the final dish, but skip it and the dish fails.',
  objectives: ['Explain why preprocessing matters and name the common data anomalies.', 'Handle missing values, duplicates and outliers.', 'Apply min-max normalization and z-score standardization.', 'Encode categorical variables with label and one-hot encoding.', 'Integrate datasets (schema integration, entity resolution, joins, unit conversion).', 'Reduce data by sampling, aggregation, data cubes and binning.'],
  lessons: [
    {
      title: 'Why data needs preparing', slides: '5–9',
      simple: 'Real data has holes, typos, duplicates and weird values. Models trust whatever you give them, so you fix it first.',
      body: '<p><strong>Data preparation</strong> (data preprocessing) transforms raw data into a form suitable for modeling.</p><p>Common anomalies found in organizations:</p>' +
        '<div class="tablebox"><table><thead><tr><th>Problem</th><th>Why it hurts</th></tr></thead><tbody><tr><td>Missing values</td><td>Nulls reduce accuracy or crash algorithms.</td></tr><tr><td>Outliers</td><td>Distort the distribution, the mean and model fit.</td></tr><tr><td>Inconsistent data</td><td>"Male", "male", "M" counted as three groups.</td></tr><tr><td>Improperly formatted data</td><td>Numbers stored as text, mixed date formats.</td></tr><tr><td>Limited features</td><td>Calls for feature engineering (creating new useful columns).</td></tr></tbody></table></div>' +
        '<p><strong>Data cleaning</strong> fills in missing values, smooths noise while identifying outliers, and corrects inconsistencies.</p>'
    },
    {
      title: 'Handling missing values', slides: '10–12',
      simple: 'Find the blanks, then either drop those rows or fill them in, usually with the mean, median or most common value.',
      body: '<ol><li><strong>Detect</strong> missing values (NaN, blanks).</li><li><strong>Decide a strategy</strong>: remove rows, replace with mean / median / mode, or impute with advanced methods.</li><li><strong>Apply it consistently</strong> across the dataset.</li></ol>' +
        '<div class="example"><span class="eyebrow">Hospital example (slide 11)</span><div class="tablebox"><table><thead><tr><th>ID</th><th>Age</th><th>Blood pressure</th><th>Diagnosis</th></tr></thead><tbody><tr><td>101</td><td>45</td><td>120</td><td>Flu</td></tr><tr><td>102</td><td><b>NaN → 52</b></td><td>130</td><td>Cold</td></tr><tr><td>103</td><td>50</td><td><b>NaN → 130</b></td><td>Diabetes</td></tr><tr><td>104</td><td>60</td><td>140</td><td><b>NaN → Flu</b></td></tr></tbody></table></div>' +
        '<p>Age: mean of 45, 50, 60 = 51.7 ≈ 52. Blood pressure: mean of 120, 130, 140 = 130. Diagnosis is categorical, so use the <strong>mode</strong>.</p></div>' +
        '<div class="analogy"><strong>Rule of thumb:</strong> numeric and symmetric → mean; numeric and skewed or with outliers → median; categorical → mode.</div>',
      exam: 'Dropping rows shrinks the sample (M3 slide 18 warns this reduces usable sample size and power). Filling with the mean shrinks the variance artificially. Always ask why the value is missing before choosing.',
      code: [{ t: 'Detect and fill', c: 'df.isnull().sum()                       # count missing per column\ndf["Age"] = df["Age"].fillna(df["Age"].mean())\ndf["BP"] = df["BP"].fillna(df["BP"].median())\ndf["Diagnosis"] = df["Diagnosis"].fillna(df["Diagnosis"].mode()[0])' }]
    },
    {
      title: 'Removing duplicates', slides: '13–15',
      body: '<p><strong>Duplicates</strong> are the same record stored more than once. They distort counts, averages and model weights.</p><ol><li>Identify duplicate rows by key columns.</li><li>Keep the first occurrence, drop the others.</li><li>Optionally merge or aggregate duplicates.</li></ol>' +
        '<div class="example"><span class="eyebrow">E-commerce orders</span><p>Order 1002 (Bob, Laptop, 1000) appears twice. After removal, three unique orders remain: 1001, 1002, 1003. Note that 1001 and 1003 (both Alice, Phone, 500) are <strong>not</strong> duplicates; their Order IDs differ.</p></div>',
      code: [{ t: 'Drop duplicates', c: 'df.duplicated().sum()\ndf = df.drop_duplicates(subset=["Order_ID"], keep="first")' }]
    },
    {
      title: 'Outliers: detect and treat', slides: '16–18',
      simple: 'Outliers are values far from the rest. Find them with a rule, then decide: keep, remove or cap.',
      body: '<p><strong>Outliers</strong> are extreme values that differ significantly from the others. They can be errors or rare but real events.</p>' +
        '<div class="formula"><span class="eyebrow">Two detection rules</span><div class="f">IQR rule: outside Q1 − 1.5·IQR or Q3 + 1.5·IQR</div><div class="f">Z-score rule: |z| &gt; 3, where z = (x − x̄) ÷ s</div></div>' +
        '<p>Then decide to <strong>keep</strong> (real and important), <strong>remove</strong> (an error), or <strong>cap</strong> (winsorize: replace with a boundary value). Apply the rule consistently to numeric features.</p>' +
        '<div class="example"><span class="eyebrow">Employee salaries (slide 17)</span><p>40,000 · 42,000 · 41,500 · <b>1,000,000</b> → the last value is removed as an outlier.</p></div>',
      exam: 'With very small samples the z-score rule can fail: an outlier inflates the SD itself. For 40k, 42k, 41.5k and 1M, the 1M salary has z ≈ 1.5 only, yet the IQR rule flags it. Investigate before deleting; a real CEO salary is not an error.'
    },
    {
      title: 'Scaling: normalization and standardization', slides: '19–21',
      simple: 'Put numbers on the same scale so a big-unit column (like pesos) does not drown out a small one (like a percentage).',
      body: '<div class="formula"><span class="eyebrow">Formulas</span><div class="f">Min-max: x′ = (x − min) ÷ (max − min) → 0 to 1</div><div class="f">Z-score: z = (x − mean) ÷ SD → mean 0, SD 1</div></div>' +
        '<div class="example"><span class="eyebrow">Exam scores (slide 20)</span><div class="tablebox"><table><thead><tr><th>Student</th><th>Math</th><th>Math (0–1)</th><th>Science</th><th>Science (0–1)</th></tr></thead><tbody><tr><td>A</td><td>90</td><td>1.0</td><td>75</td><td>0.5</td></tr><tr><td>B</td><td>60</td><td>0.5</td><td>80</td><td>1.0</td></tr><tr><td>C</td><td>30</td><td>0.0</td><td>70</td><td>0.0</td></tr></tbody></table></div><p>Math: (60 − 30) ÷ (90 − 30) = 0.5. Science: (75 − 70) ÷ (80 − 70) = 0.5.</p></div>' +
        '<p><strong>Store the scaling parameters</strong> (min, max, mean, SD) from the training data and reuse them on new data.</p>',
      exam: 'Min-max is sensitive to outliers (one huge max squashes everything else near 0). Z-score handles that better. Distance-based models (KNN, K-means, SVR) need scaling; tree models do not.'
    },
    {
      title: 'Fixing types, categories and dates', slides: '22–30',
      body: '<h4>Data type conversion</h4><p>Make sure each column has the right type: "100" (text) → 100 (integer), "10.5" → 10.5 (float), "2023-01-01" → a datetime. Inspect, convert (e.g., <code>astype()</code>), then validate.</p>' +
        '<h4>Inconsistent categories</h4><p>"Male", "male", "FEMALE", "F" → inspect unique values, standardize text (lowercase, strip spaces), then map to one label: Male / Female.</p>' +
        '<h4>Parsing dates</h4><p>"01/05/2023", "2023-05-02", "May 3, 2023" → one format, YYYY-MM-DD. Then extract useful features such as year, month and weekday.</p>',
      code: [{ t: 'Standardize categories (slide 27)', c: 'df["Gender"] = df["Gender"].str.lower().map(\n    {"male": "Male", "m": "Male", "female": "Female", "f": "Female"})\ndf["Sales"] = df["Sales"].astype(int)\ndf["Order_Date"] = pd.to_datetime(df["Order_Date"], format="mixed")\ndf["weekday"] = df["Order_Date"].dt.day_name()' }]
    },
    {
      title: 'Encoding categories as numbers', slides: '31–33',
      simple: 'Most models only understand numbers, so each category becomes 0/1 columns (one-hot) or a number code (label).',
      body: '<div class="tablebox"><table><thead><tr><th>Method</th><th>How</th><th>Use when</th></tr></thead><tbody><tr><td><strong>Label encoding</strong></td><td>HR = 0, IT = 1, Sales = 2</td><td>The categories are ordinal, or the model is tree-based.</td></tr><tr><td><strong>One-hot encoding</strong></td><td>One 0/1 column per category</td><td>Nominal categories with no order (most cases).</td></tr></tbody></table></div>' +
        '<div class="example"><span class="eyebrow">Employee department (slide 32)</span><div class="tablebox"><table><thead><tr><th>ID</th><th>HR</th><th>IT</th><th>Sales</th></tr></thead><tbody><tr><td>1 (HR)</td><td>1</td><td>0</td><td>0</td></tr><tr><td>2 (IT)</td><td>0</td><td>1</td><td>0</td></tr><tr><td>3 (Sales)</td><td>0</td><td>0</td><td>1</td></tr></tbody></table></div></div>',
      exam: 'Label encoding nominal data invents a fake order (Sales = 2 looks "bigger" than HR = 0), which misleads distance-based and linear models. One-hot avoids that but adds a column per category.',
      code: [{ t: 'One-hot encode', c: 'pd.get_dummies(df, columns=["Department"])' }]
    },
    {
      title: 'Integrating data from several sources', slides: '34–45',
      body: '<p>Four steps, each with an example from the slides:</p>' +
        '<div class="tablebox"><table><thead><tr><th>Step</th><th>What it solves</th><th>Example</th></tr></thead><tbody>' +
        '<tr><td><strong>Schema integration</strong></td><td>Different names for the same concept</td><td>Cust_ID vs CustomerID, Email vs Email_Address → one common schema</td></tr>' +
        '<tr><td><strong>Entity resolution</strong></td><td>The same entity recorded differently across sources</td><td>"Alice" (A) and "Alice W" (B) share phone 1234567890 → one record</td></tr>' +
        '<tr><td><strong>Consolidation</strong></td><td>Combining tables</td><td>Join Orders and Payments on Order_ID (inner, left, right, outer), or concatenate rows</td></tr>' +
        '<tr><td><strong>Transformation</strong></td><td>Different units, formats or scales</td><td>EUR → USD at 1.1: 90 → 99, 150 → 165</td></tr></tbody></table></div>' +
        '<p>Entity resolution matches on unique keys (email, phone). With no exact key, use <strong>fuzzy matching</strong>.</p>',
      code: [{ t: 'Join two sources', c: 'merged = orders.merge(payments, on="Order_ID", how="inner")\nall_rows = pd.concat([sales_2024, sales_2025], ignore_index=True)' }]
    },
    {
      title: 'Reducing data: sampling, aggregation, binning', slides: '46–62',
      simple: 'Make the data smaller but still faithful: take a sample, summarize it, or group continuous numbers into bins.',
      body: '<p><strong>Data reduction</strong> gives a much smaller representation that keeps the integrity of the original.</p>' +
        '<ul><li><strong>Sampling</strong>: pick a representative subset (random or stratified).</li><li><strong>Numerosity reduction (aggregation)</strong>: replace raw rows with sums, means or counts. Daily sales 100 + 150 + 120 → January total 370.</li><li><strong>Data cube aggregation</strong>: summarize across dimensions (Product × Region × Time). Phone: 500 (Asia) + 300 (Europe) = 800.</li><li><strong>Discretization (binning)</strong>: turn a continuous variable into intervals.</li></ul>' +
        '<div class="tablebox"><table><thead><tr><th>Binning type</th><th>Rule</th><th>Example</th></tr></thead><tbody><tr><td><strong>Equal-width</strong></td><td>Divide the range into k intervals of the same size</td><td>Ages into 10–20, 20–30, 30–40, 40–50</td></tr><tr><td><strong>Equal-frequency (quantile)</strong></td><td>Each bin gets about the same number of records</td><td>6 incomes into 3 bins of 2: Low, Medium, High</td></tr><tr><td><strong>Custom (domain)</strong></td><td>Bins set by business rules</td><td>Child 0–12, Teen 13–19, Adult 20–39, Senior 60+</td></tr></tbody></table></div>',
      exam: 'Equal-width bin size = (max − min) ÷ k. Ages 15 to 55 with k = 4 → width 10. Equal-width bins can end up nearly empty with skewed data; equal-frequency bins avoid that but have uneven widths.',
      code: [{ t: 'Binning in pandas (slide 60)', c: 'df["Age_Bin"] = pd.cut(df["Age"], bins=4)                 # equal width\nincome["Income_Bin"] = pd.qcut(income["Income"], q=3,\n                               labels=["Low", "Medium", "High"])  # equal frequency' }]
    }
  ],
  traps: [
    { title: 'Mean, median or mode for filling gaps?', text: 'Numeric and symmetric → mean. Numeric with outliers or skew → median. Categorical (like Diagnosis) → <strong>mode</strong>. You can never fill a category with a mean.' },
    { title: 'Normalization vs standardization', text: '<strong>Min-max normalization</strong> squeezes values into 0–1. <strong>Z-score standardization</strong> centers on mean 0 with SD 1. They are not the same thing, even though people use the words loosely.' },
    { title: 'Label encoding invents an order', text: 'HR = 0, IT = 1, Sales = 2 tells a distance-based model that Sales is "twice" IT. Use one-hot for nominal categories.' },
    { title: 'Same values ≠ duplicate', text: 'Two orders by Alice for a 500 Phone with different Order IDs are two real purchases. Duplicates are identified by the key, not by matching other columns.' },
    { title: 'Not every outlier is an error', text: 'Detect with IQR or z-score, then investigate. Removing a real but rare value (a big order, an emergency) throws away information.' },
    { title: 'Equal-width vs equal-frequency', text: 'Equal-<em>width</em> = same interval size. Equal-<em>frequency</em> = same number of records per bin (quantiles). The slides’ <code>pd.qcut</code> is equal-frequency; <code>pd.cut</code> is equal-width.' }
  ],
  quiz: [
    { type: 'mcq', topic: 'Missing values', q: 'The Diagnosis column has a missing value. Which fill method fits?', options: ['Mean', 'Median', 'Mode', 'Z-score'], answer: 2, why: ['You cannot average categories like "Flu" and "Cold".', 'The median needs ordered numbers.', 'Correct: use the most common category.', 'Z-score is a scaling method, not imputation.'] },
    { type: 'num', topic: 'Missing values', q: 'Ages are 45, missing, 50, 60. Fill the missing age with the mean of the known ages (one decimal).', answer: 51.7, tol: 0.05, explain: '(45 + 50 + 60) ÷ 3 = 51.67 ≈ 51.7 (the slide rounds it to 52).' },
    { type: 'mcq', topic: 'Missing values', q: 'Income data is heavily right-skewed. Which is usually the better fill value?', options: ['Mean', 'Median', 'Mode', 'Maximum'], answer: 1, why: ['A few large incomes pull the mean up.', 'Correct: the median resists skew and outliers.', 'The mode is meant for categories.', 'The maximum would bias every filled value upward.'] },
    { type: 'num', topic: 'Scaling', q: 'Math scores are 90, 60, 30. What is the min-max normalized value of 60?', answer: 0.5, tol: 0.001, explain: '(60 − 30) ÷ (90 − 30) = 30 ÷ 60 = 0.5.' },
    { type: 'num', topic: 'Scaling', q: 'Science scores are 75, 80, 70. What is the min-max normalized value of 75?', answer: 0.5, tol: 0.001, explain: '(75 − 70) ÷ (80 − 70) = 0.5.' },
    { type: 'num', topic: 'Scaling', q: 'A value of 86 with mean 90 and SD 6. What is its z-score? (two decimals)', answer: -0.67, tol: 0.01, explain: '(86 − 90) ÷ 6 = −0.67.' },
    { type: 'mcq', topic: 'Scaling', q: 'Why scale features before a distance-based model?', options: ['To remove missing values', 'So no feature dominates just because of its units', 'To turn categories into numbers', 'To reduce the number of rows'], answer: 1, why: ['Scaling does not handle missing values.', 'Correct: a column in pesos would otherwise drown out a column in percentages.', 'That is encoding.', 'That is data reduction.'] },
    { type: 'mcq', topic: 'Encoding', q: 'Department has values HR, IT, Sales with no natural order. Best encoding for a linear or distance-based model?', options: ['Label encoding', 'One-hot encoding', 'Min-max normalization', 'Equal-width binning'], answer: 1, why: ['Label encoding invents a fake order (Sales > IT > HR).', 'Correct: one 0/1 column per department.', 'Normalization is for numeric columns.', 'Binning applies to continuous numbers.'] },
    { type: 'mcq', topic: 'Integration', q: 'Dataset A has "Cust_ID"; dataset B has "CustomerID" for the same thing. Aligning them is called…', options: ['Entity resolution', 'Schema integration', 'Data cube aggregation', 'Discretization'], answer: 1, why: ['Entity resolution merges records about the same real-world entity.', 'Correct: mapping equivalent attributes to one common name.', 'Data cubes summarize data across dimensions.', 'Discretization bins continuous values.'] },
    { type: 'mcq', topic: 'Integration', q: '"Alice" in one hospital system and "Alice W" in another share phone 1234567890. Merging them into one patient is…', options: ['Schema integration', 'Entity resolution', 'Sampling', 'Normalization'], answer: 1, why: ['Schema integration aligns column names, not records.', 'Correct: identifying records that refer to the same entity.', 'Sampling picks a subset.', 'Normalization rescales numbers.'] },
    { type: 'num', topic: 'Integration', q: 'Convert €150 to USD at 1 EUR = 1.1 USD.', answer: 165, tol: 0.01, unit: 'USD', explain: '150 × 1.1 = 165.' },
    { type: 'mcq', topic: 'Data reduction', q: 'Each bin holds roughly the same number of records. This is…', options: ['Equal-width binning', 'Equal-frequency binning', 'Custom binning', 'Aggregation'], answer: 1, why: ['Equal-width keeps interval sizes equal, not counts.', 'Correct: quantile binning, e.g. pd.qcut.', 'Custom bins follow business rules.', 'Aggregation summarizes rows into totals or means.'] },
    { type: 'num', topic: 'Data reduction', q: 'Ages range from 15 to 55. With equal-width binning into 4 bins, how wide is each bin?', answer: 10, tol: 0, explain: '(55 − 15) ÷ 4 = 10.' },
    { type: 'mcq', topic: 'Duplicates', q: 'Which pair is a true duplicate in an orders table?', options: ['Two rows: Alice, Phone, 500 with Order IDs 1001 and 1003', 'Two rows with Order ID 1002, Bob, Laptop, 1000', 'Two different customers who bought laptops', 'Two orders on the same date'], answer: 1, why: ['Different Order IDs mean two real purchases.', 'Correct: same key, same record stored twice.', 'Different customers are different records.', 'The same date alone does not make a duplicate.'] },
    { type: 'tf', topic: 'Outliers', q: 'Every outlier should be deleted, since it is always a data error.', answer: 1, explain: 'False. Outliers can be errors or rare real events. Investigate first, then keep, remove or cap.' }
  ],
  cards: [
    ['Five common data anomalies?', 'Missing values, outliers, inconsistent data, improperly formatted data, limited features.', ''],
    ['Fill a missing category with…?', 'The mode (most frequent value).', 'Mean and median only work for numbers.'],
    ['Min-max formula?', '(x − min) ÷ (max − min), giving 0 to 1.', ''],
    ['Z-score formula?', '(x − mean) ÷ SD, giving mean 0 and SD 1.', ''],
    ['IQR outlier rule?', 'Below Q1 − 1.5·IQR or above Q3 + 1.5·IQR.', 'IQR = Q3 − Q1.'],
    ['Label vs one-hot encoding?', 'Label: one integer per category (implies order). One-hot: one 0/1 column per category.', ''],
    ['Four steps of data integration?', 'Schema integration, entity resolution, consolidation (joins), transformation (units/formats).', ''],
    ['Equal-width vs equal-frequency bins?', 'Equal-width: same interval size. Equal-frequency: same number of records per bin.', 'pd.cut vs pd.qcut.'],
    ['What is a data cube?', 'A multi-dimensional summary (e.g., sales by product × region × time) stored instead of raw transactions.', '']
  ],
  cheat: '<div class="card stack"><h3>Cleaning checklist</h3><p>Missing → drop or fill (mean / median / mode)<br>Duplicates → keep first by key<br>Outliers → IQR or |z| &gt; 3 → keep / remove / cap<br>Types → astype, to_datetime<br>Categories → lowercase + map</p></div>' +
    '<div class="card stack"><h3>Scaling</h3><p><b>Min-max</b> (x − min) ÷ (max − min) → 0–1<br><b>Z-score</b> (x − x̄) ÷ s → mean 0, SD 1<br>Needed for KNN, K-means, SVR, LDA. Not for trees.</p></div>' +
    '<div class="card stack"><h3>Encoding</h3><p><b>Label</b>: 0, 1, 2 (ordinal or trees)<br><b>One-hot</b>: a 0/1 column per category (nominal)</p></div>' +
    '<div class="card stack"><h3>Integration</h3><p>Schema integration (column names) → Entity resolution (same entity) → Consolidation (joins: inner/left/right/outer, concat) → Transformation (units, currency)</p></div>' +
    '<div class="card stack"><h3>Reduction</h3><p>Sampling (random / stratified) · Aggregation (sum, mean, count) · Data cube · Binning: equal-width, equal-frequency, custom</p></div>'
});
