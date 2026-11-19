(window.REVIEWER = window.REVIEWER || { modules: [] }).modules.push({
  id: 'm1', num: 1, title: 'Exploratory Data Analysis', short: 'EDA',
  blurb: 'Variable types, mean/median/mode, spread, histograms and skew.',
  steps: [3],
  pipelineNote: 'EDA is Step 3, Explore. Every later module starts with it: you look at distributions, typical values and outliers before you trust any model.',
  thirty: 'Before modeling, describe the data: what kind of variables you have, where the typical value sits, how spread out values are, and what shape the distribution takes.',
  analogy: 'Think of EDA as meeting a new class before teaching it: you check who is there, what is typical, and who stands out, before planning anything.',
  objectives: ['Define the basic terms of statistical analysis (data set, variable, observation).', 'Classify variables as discrete, continuous, ordinal, binary or qualitative.', 'Compute and interpret mean, median, mode, range, variance and standard deviation.', 'Read a histogram or box plot for symmetry and skew.', 'Summarize data with frequency tables, pivot tables and charts.'],
  lessons: [
    {
      title: 'Why we summarize data', slides: '5–13',
      simple: 'Raw data is a messy pile. Summaries turn it into a few numbers and pictures so you can see what is normal and what is odd.',
      body: '<p><strong>Raw data</strong> is data as collected, before any processing or ranking: raw survey answers, exam scores, sensor readings, web server logs.</p>' +
        '<p>The goal of summarizing is to <strong>see the characteristics of the data quickly</strong>: what values are normal and which ones are odd.</p>' +
        '<p><strong>Statistics</strong> is the science of collecting, analyzing, presenting and interpreting data, and of making decisions from that analysis. It has two branches:</p>' +
        '<div class="tablebox"><table><thead><tr><th>Branch</th><th>What it does</th><th>Example</th></tr></thead><tbody>' +
        '<tr><td><strong>Descriptive</strong></td><td>Organizes, displays and describes data with tables, graphs and summary measures.</td><td>Average age of the 50 students you surveyed.</td></tr>' +
        '<tr><td><strong>Inferential</strong></td><td>Uses a sample to make decisions or predictions about a whole population.</td><td>A company samples customers to predict demand for a new product.</td></tr></tbody></table></div>',
      exam: 'A quick test for which branch a statement belongs to: if it only describes the data you actually have, it is descriptive. If it generalizes beyond the data (to a population or the future), it is inferential.'
    },
    {
      title: 'Data sets, variables and observations', slides: '14–15',
      simple: 'Columns are variables, rows are observations, and the whole table is the data set.',
      body: '<ul><li>A <strong>data set</strong> is a collection of observations on one or more variables.</li><li>A <strong>variable</strong> is a characteristic that takes different values for different elements (a column).</li><li>An <strong>observation</strong> (or measurement) is one value of a variable; in a table, one row is one record of observations.</li></ul>' +
        '<div class="example"><span class="eyebrow">From the slides</span><div class="tablebox"><table><thead><tr><th>Customer ID</th><th>First name</th><th>Last name</th><th>Address</th><th>Age</th></tr></thead><tbody><tr><td>1</td><td>Ana</td><td>Liza</td><td>Quezon</td><td>29</td></tr><tr><td>2</td><td>Ben</td><td>Tan</td><td>Makati</td><td>30</td></tr><tr><td>3</td><td>Rose</td><td>Park</td><td>Antipolo</td><td>22</td></tr></tbody></table></div><p>Variables: Customer ID, First name, Last name, Address, Age. Each customer row is an observation. All the rows together are the data set.</p></div>'
    },
    {
      title: 'Types of variables', slides: '16–22',
      simple: 'Numbers you can count (discrete) or measure (continuous), versus labels (categorical). Ordered labels are ordinal; two-choice labels are binary.',
      body: '<div class="tablebox"><table><thead><tr><th>Type</th><th>Meaning</th><th>Examples</th></tr></thead><tbody>' +
        '<tr><td><strong>Quantitative · discrete</strong></td><td>Countable whole numbers; only distinct values.</td><td>Students in a room, products sold per day, defects on a line.</td></tr>' +
        '<tr><td><strong>Quantitative · continuous</strong></td><td>Any value in an interval (also called float, interval, numeric).</td><td>Height 165.45 cm, weight 52.345 kg, race time 10.231 s.</td></tr>' +
        '<tr><td><strong>Qualitative / categorical</strong></td><td>Values are categories or descriptions, not measurements.</td><td>Interview transcripts, open-ended answers, photos, field notes, city.</td></tr>' +
        '<tr><td><strong>Ordinal</strong></td><td>Categories with an explicit order (an “ordered factor”).</td><td>Education level, contest place (1st, 2nd, 3rd), age ranges.</td></tr>' +
        '<tr><td><strong>Binary</strong></td><td>A categorical variable with exactly two categories (dichotomous, logical, indicator).</td><td>0/1, True/False, Yes/No.</td></tr></tbody></table></div>' +
        '<div class="analogy"><strong>Quick test:</strong> Can you sensibly average it? Then it is quantitative. Can you count it in whole units only? Discrete. Does the order of labels matter? Ordinal.</div>',
      exam: 'Watch for numbers that are really labels: a Customer ID or a ZIP code is stored as digits but is categorical, because averaging it means nothing. Age ranges ("19–25") are ordinal even though they look numeric.'
    },
    {
      title: 'What EDA is for', slides: '23–24',
      body: '<p><strong>Exploratory Data Analysis (EDA)</strong> is the initial investigation of data to discover patterns, spot anomalies and check assumptions, using summary statistics and graphs.</p>' +
        '<ol><li><strong>Identify patterns and relationships</strong>: correlations, trends and links between variables.</li><li><strong>Detect anomalies and outliers</strong> that could skew results or reveal errors.</li><li><strong>Improve data quality</strong> by catching errors and missing values early.</li><li><strong>Inform modeling decisions</strong>: which technique and which preprocessing to use.</li></ol>' +
        '<p>Every later module repeats this step: scatterplots before regression (M3), a time plot before forecasting (M4), item frequencies before association rules (M5), distributions before K-means (M6).</p>'
    },
    {
      title: 'Central tendency: mean, median, mode', slides: '25–28',
      simple: 'Mean is the average, median is the middle value after sorting, mode is the most common value.',
      body: '<p>A first step in exploring a variable is finding its <strong>typical value</strong>, the center where most data sit.</p>' +
        '<div class="formula"><span class="eyebrow">Formulas</span><div class="f">x̄ = Σx ÷ n</div><div style="font-size:.95rem">Median: sort the values; take the middle one (or the average of the two middle values when n is even). Mode: the value with the highest frequency; report every tied value.</div></div>' +
        '<div class="example"><span class="eyebrow">Worked example</span><p>Data: 4, 8, 6, 5, 3, 8, 9 (n = 7)</p><ul><li>Mean = 43 ÷ 7 = <strong>6.14</strong></li><li>Sorted: 3, 4, 5, <strong>6</strong>, 8, 8, 9 → median = <strong>6</strong></li><li>8 appears twice → mode = <strong>8</strong></li></ul></div>' +
        '<p>The mean uses every value, so a single extreme value pulls it. The median only cares about order, so it resists outliers. That is why incomes and house prices are usually reported with the median.</p>',
      exam: 'For an even count, e.g. 2, 4, 7, 9, the median is (4 + 7) ÷ 2 = 5.5. The mode is the only one of the three you can use on nominal categorical data (e.g., the most common city).'
    },
    {
      title: 'Spread: range, variance, standard deviation', slides: '29–33',
      simple: 'Spread tells you whether values huddle together or scatter. Standard deviation is roughly the average distance from the mean.',
      body: '<p><strong>Variability</strong> (dispersion) measures whether values are tightly clustered or spread out.</p>' +
        '<div class="formula"><span class="eyebrow">Formulas</span><div class="f">Range = largest − smallest</div><div class="f">s² = Σ(x − x̄)² ÷ (n − 1) &nbsp;·&nbsp; s = √s²</div><div style="font-size:.9rem">For a whole population, divide by N instead of n − 1 and use μ for the mean (σ).</div></div>' +
        '<p>Properties of the standard deviation (slide 33):</p><ul><li>It is <strong>never negative</strong>; the smallest possible value is 0 (all values identical).</li><li>It is <strong>affected by outliers</strong>, because it is built from distances to the mean.</li><li>It has the <strong>same units</strong> as the data (variance is in squared units).</li><li>Small SD → values close to the mean; large SD → values far from the mean on average.</li></ul>' +
        '<div class="example"><span class="eyebrow">Worked example</span><p>Data 2, 4, 4, 4, 5, 5, 7, 9: mean = 5. Squared deviations: 9, 1, 1, 1, 0, 0, 4, 16 → sum 32. Sample variance = 32 ÷ 7 = 4.57, so s = <strong>2.14</strong>. Range = 9 − 2 = <strong>7</strong>.</p></div>',
      exam: 'The slides say SD "is used when the data are normally distributed". It can be computed for any numeric data, but it is most interpretable for roughly symmetric data (about 68% of values within 1 SD of the mean under a normal curve). For skewed data, the IQR is often the better spread measure.'
    },
    {
      title: 'Shape: histograms, box plots and skew', slides: '34–43',
      simple: 'Draw the data. If the tail stretches right, the mean gets pulled right (biggest). If it stretches left, the mean gets pulled left (smallest).',
      body: '<p>You can describe shape <strong>graphically</strong> (histograms, box plots) or with <strong>shape statistics</strong> (skewness, kurtosis).</p>' +
        '<ul><li>A <strong>histogram</strong> plots a frequency table: bins on the x-axis, counts (or proportions) on the y-axis.</li><li>A <strong>box plot</strong> (Tukey) shows the median, quartiles and outliers at a glance.</li></ul>' +
        '<div class="tablebox"><table><thead><tr><th>Shape</th><th>Tail</th><th>Order of measures</th><th>Skewness value</th><th>Example</th></tr></thead><tbody>' +
        '<tr><td><strong>Symmetric</strong></td><td>None</td><td>mean = median = mode</td><td>≈ 0</td><td>Heights</td></tr>' +
        '<tr><td><strong>Right / positive skew</strong></td><td>Long tail to the right</td><td>mode &lt; median &lt; mean</td><td>&gt; 0</td><td>Individual incomes</td></tr>' +
        '<tr><td><strong>Left / negative skew</strong></td><td>Long tail to the left</td><td>mean &lt; median &lt; mode</td><td>&lt; 0</td><td>Age at death</td></tr></tbody></table></div>' +
        '<div class="analogy"><strong>Memory hook:</strong> the skew is named for the tail, and the mean chases the tail.</div>' +
        '<p><strong>Kurtosis</strong> describes how heavy the tails are compared with a normal distribution (more extreme values → higher kurtosis).</p>',
      exam: 'Slides 42–43 word this backwards: they say a positive value means "the average is skewed to the left". Write it the standard way: positive skewness = long right tail, mean pulled above the median.'
    },
    {
      title: 'Summarizing grouped and ungrouped data', slides: '8–10, 44–46',
      body: '<p><strong>Ungrouped data</strong> is the list of individual values (e.g., the ages of 50 students). <strong>Grouped data</strong> is organized into a frequency distribution (e.g., how many students fall into 17–18, 19–20, 21–22).</p>' +
        '<p>Steps in data summarization (slide 44):</p><ol><li>Calculate measures of <strong>central tendency</strong>: mean, median, mode.</li><li>Calculate measures of <strong>variability</strong>: range, variance or standard deviation.</li><li>Use <strong>data analysis tools</strong>: pivot tables, charts, subtotals and totals.</li></ol>' +
        '<div class="example"><span class="eyebrow">Categorical summary</span><p>For a categorical variable like student status (Regular / Irregular), summarize with counts and percentages in a frequency table, then show a bar chart. A mean makes no sense here; the mode does.</p></div>',
      exam: 'Grouped mean: x̄ ≈ Σ(f · m) ÷ Σf, where m is each class midpoint and f its frequency. Example: classes 10–19 (f=3), 20–29 (f=5), 30–39 (f=2) → midpoints 14.5, 24.5, 34.5 → (43.5 + 122.5 + 69) ÷ 10 = 23.5.',
      code: [{ t: 'Quick summary in pandas', c: 'import pandas as pd\ndf = pd.read_csv("students.csv")\nprint(df.describe())                 # mean, std, min, quartiles, max\nprint(df["age"].median(), df["age"].mode())\nprint(df["status"].value_counts())   # frequency table\nprint(df.pivot_table(index="status", values="age", aggfunc="mean"))' }]
    }
  ],
  traps: [
    { errata: true, slide: 'slides 42–43', title: 'Skewness direction is worded backwards', text: 'The slides say a positive value means the average is "skewed to the left" and a negative one "skewed to the right", and both mention a tail of "more positive values". Correct version: <strong>positive skew = long right tail (mean &gt; median)</strong>; <strong>negative skew = long left tail (mean &lt; median)</strong>. Slides 38–39 get the histograms right.' },
    { title: 'The mean is not always the best "typical value"', text: 'One extreme value moves the mean a lot. With skewed data or outliers (salaries, house prices), report the median.' },
    { title: 'IDs and codes are not quantitative', text: 'Customer ID 1–5 is made of digits but it is a label. Ask: does an average of this mean anything? If not, it is categorical.' },
    { title: 'Discrete vs continuous', text: 'Discrete = counted (whole numbers). Continuous = measured (any value in a range). "Number of defects" is discrete even if the average is 2.4.' },
    { title: 'Variance vs standard deviation units', text: 'Variance is in squared units (kg²); the standard deviation is back in the original units (kg). Only the SD is directly comparable to the data.' },
    { title: 'Standard deviation can be 0 but never negative', text: 'SD = 0 means every value is identical. A negative SD is always a calculation error.' }
  ],
  quiz: [
    { type: 'mcq', topic: 'Variable types', q: 'The number of products sold in a day is which type of variable?', options: ['Continuous', 'Discrete', 'Ordinal', 'Binary'], answer: 1, why: ['Continuous values can take any value in an interval, like 10.231 seconds.', 'Correct: it is counted in whole units.', 'Ordinal variables are ordered categories, not counts.', 'Binary has exactly two categories.'] },
    { type: 'mcq', topic: 'Variable types', q: 'Education level (High School, Bachelor’s, Master’s, Doctorate) is…', options: ['Nominal categorical', 'Ordinal', 'Continuous', 'Discrete'], answer: 1, why: ['There is a natural order here, so it is more than nominal.', 'Correct: categories with an explicit order.', 'You cannot measure it on a continuous scale.', 'It is a category, not a count.'] },
    { type: 'tf', topic: 'Variable types', q: 'A Customer ID stored as the numbers 1, 2, 3… is a quantitative variable because it is made of digits.', answer: 1, explain: 'False. IDs are labels; averaging them is meaningless, so they are categorical.' },
    { type: 'mcq', topic: 'Statistics branches', q: 'A company surveys 400 customers to predict demand across its whole market. This is…', options: ['Descriptive statistics', 'Inferential statistics', 'Exploratory data analysis only', 'Data preparation'], answer: 1, why: ['Descriptive statistics only describe the 400 customers themselves.', 'Correct: a sample is used to say something about the population.', 'EDA explores the data but does not by itself generalize to the population.', 'Preparation cleans data; it does not predict.'] },
    { type: 'num', topic: 'Central tendency', q: 'Find the mean of 4, 8, 6, 5, 3, 8, 9. Round to two decimals.', answer: 6.14, tol: 0.01, explain: 'Sum = 43, n = 7 → 43 ÷ 7 = 6.14.' },
    { type: 'num', topic: 'Central tendency', q: 'Find the median of 12, 7, 3, 9, 15, 10.', answer: 9.5, tol: 0.001, explain: 'Sorted: 3, 7, 9, 10, 12, 15. With an even count, average the two middle values: (9 + 10) ÷ 2 = 9.5.' },
    { type: 'mcq', topic: 'Central tendency', q: 'Salaries: 40,000; 42,000; 41,500; 1,000,000. Which measure best describes a typical salary?', options: ['Mean', 'Median', 'Range', 'Standard deviation'], answer: 1, why: ['The mean is about 280,875, pulled far up by the one extreme salary.', 'Correct: the median (41,750) ignores how extreme the outlier is.', 'Range measures spread, not a typical value.', 'SD measures spread, not a typical value.'] },
    { type: 'num', topic: 'Spread', q: 'Range of 15, 22, 9, 31, 18?', answer: 22, tol: 0, explain: '31 − 9 = 22.' },
    { type: 'num', topic: 'Spread', q: 'Sample standard deviation of 2, 4, 4, 4, 5, 5, 7, 9? Round to two decimals.', answer: 2.14, tol: 0.01, hint: 'Mean is 5. Sum the squared deviations, divide by n − 1 = 7, take the square root.', explain: 'Squared deviations sum to 32; 32 ÷ 7 = 4.571; √4.571 = 2.14.' },
    { type: 'mcq', topic: 'Spread', q: 'Which statement about the standard deviation is FALSE?', options: ['It can never be negative', 'It is affected by outliers', 'It has the same units as the data', 'It is unaffected by extreme values because it uses the mean'], answer: 3, why: ['True, the smallest possible value is 0.', 'True, outliers are far from the mean, so they inflate it.', 'True, unlike the variance.', 'Correct pick: this is false. Because it is built from distances to the mean, extreme values inflate it.'] },
    { type: 'mcq', topic: 'Shape & skew', q: 'A histogram has a long tail to the right. How do mean, median and mode compare?', options: ['mean = median = mode', 'mean > median > mode', 'mean < median < mode', 'median > mean > mode'], answer: 1, why: ['That is a symmetric distribution.', 'Correct: the mean chases the long right tail.', 'That describes a left (negative) skew.', 'The median sits between the mode and the mean.'] },
    { type: 'mcq', topic: 'Shape & skew', q: 'Age at death in most populations (most people die between 70 and 80) is…', options: ['Positively skewed', 'Negatively skewed', 'Symmetric', 'Uniform'], answer: 1, why: ['A positive skew has a long right tail, like incomes.', 'Correct: the long tail points left, toward younger ages.', 'There is a clear tail, so it is not symmetric.', 'Values are not spread evenly.'] },
    { type: 'tf', topic: 'Shape & skew', q: 'A skewness value greater than 0 indicates a long tail on the right side of the distribution.', answer: 0, explain: 'True. (The slides word this backwards; this is the standard definition.)' },
    { type: 'mcq', topic: 'EDA purpose', q: 'Which is NOT one of the stated purposes of EDA?', options: ['Identify patterns and relationships', 'Detect anomalies and outliers', 'Prove that one variable causes another', 'Inform modeling decisions'], answer: 2, why: ['This is a purpose of EDA.', 'This is a purpose of EDA.', 'Correct pick: EDA finds associations; it cannot prove causation.', 'This is a purpose of EDA.'] },
    { type: 'mcq', topic: 'Summarizing', q: 'Which summary is meaningful for the variable "student status" (Regular/Irregular)?', options: ['Mean', 'Standard deviation', 'Mode and frequency table', 'Range'], answer: 2, why: ['You cannot average labels.', 'SD needs numbers.', 'Correct: count each category and report the most common one.', 'Range needs numbers.'] }
  ],
  cards: [
    ['Descriptive vs inferential statistics?', 'Descriptive describes the data you have; inferential uses a sample to say something about a population.', 'Survey average = descriptive. Predicting national demand from the survey = inferential.'],
    ['Discrete vs continuous?', 'Discrete is counted in whole numbers; continuous is measured and can take any value in a range.', 'Products sold per day vs. weight in kg.'],
    ['What is an ordinal variable?', 'A categorical variable whose categories have a natural order.', 'Education level, contest placing, age ranges.'],
    ['Right-skewed: order of mean, median, mode?', 'mode < median < mean.', 'The mean is pulled toward the long right tail.'],
    ['Why prefer the median for incomes?', 'It resists outliers; a few huge incomes drag the mean up.', ''],
    ['Smallest possible standard deviation?', '0, when every value is identical.', 'It can never be negative.'],
    ['Units of variance vs standard deviation?', 'Variance is in squared units; SD is in the original units.', ''],
    ['Four purposes of EDA?', 'Find patterns/relationships, detect outliers, improve data quality, inform modeling decisions.', '']
  ],
  cheat: '<div class="card stack"><h3>Variable types</h3><p>Quantitative: <b>discrete</b> (counted) · <b>continuous</b> (measured).<br>Categorical: <b>nominal</b> · <b>ordinal</b> (ordered) · <b>binary</b> (two values).</p></div>' +
    '<div class="card stack"><h3>Center</h3><p><b>Mean</b> x̄ = Σx ÷ n (sensitive to outliers)<br><b>Median</b> middle of sorted data (robust)<br><b>Mode</b> most frequent (works for categories)</p></div>' +
    '<div class="card stack"><h3>Spread</h3><p><b>Range</b> = max − min<br><b>Variance</b> s² = Σ(x − x̄)² ÷ (n − 1)<br><b>SD</b> s = √s², same units as data, ≥ 0, hurt by outliers</p></div>' +
    '<div class="card stack"><h3>Shape</h3><p>Symmetric: mean = median = mode<br>Right skew (+): mode &lt; median &lt; mean<br>Left skew (−): mean &lt; median &lt; mode<br><i>The mean chases the tail.</i></p></div>' +
    '<div class="card stack"><h3>Summarization steps</h3><p>1 Center → 2 Spread → 3 Tools: pivot tables, charts, subtotals.</p></div>' +
    '<div class="card stack"><h3>EDA does</h3><p>Patterns · outliers · data quality · modeling choices. It does <b>not</b> prove causation.</p></div>'
});
