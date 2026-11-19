(window.REVIEWER = window.REVIEWER || { modules: [] }).modules.push({
  id: 'm6', num: 6, title: 'K-Means Clustering', short: 'K-Means',
  blurb: 'Unsupervised segments, z-scores, Euclidean distance, elbow and silhouette.',
  steps: [1, 2, 3, 5, 6, 7],
  pipelineNote: 'Clustering has no target label, so Step 4 (Split) changes meaning: compare K values on a development sample, then check the segments stay stable on a holdout sample or a later period.',
  thirty: 'K-means groups similar records without any labels. It places K centers, assigns every customer to the nearest one, moves each center to the average of its customers, and repeats until nothing changes.',
  analogy: 'Picture K tables at a party. Everyone sits at the closest table, then each table moves to the middle of its group, and people re-pick the closest table. After a few rounds, the groups settle.',
  objectives: ['Explain clustering as unsupervised learning.', 'Prepare and standardize data for K-means.', 'Compute Euclidean distance and run the K-means steps by hand.', 'Choose K with inertia (elbow) and silhouette score.', 'Profile and name clusters for business action.', 'Explain how PCA helps visualize clusters.'],
  lessons: [
    {
      title: 'Clustering in business', slides: '3–10',
      simple: 'You don’t tell the model the groups. It finds customers who look alike, and you name the groups afterward.',
      body: '<p><strong>Clustering</strong> groups similar records <strong>without a target label</strong>. It is <strong>unsupervised learning</strong>: the model uses feature values to find natural patterns.</p>' +
        '<p><strong>K-means</strong> assigns each record to the nearest cluster center, the <strong>centroid</strong>. Records in the same cluster have similar numeric patterns. The output is a <strong>segment label</strong> for each customer (Cluster 1, 2, 3), not a prediction of a known class.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Industry</th><th>Use</th></tr></thead><tbody><tr><td>Retail</td><td>Customer segments for campaigns and loyalty offers</td></tr><tr><td>Banking</td><td>Account holders by product use and transactions</td></tr><tr><td>Telecom</td><td>Usage segments for retention plans</td></tr><tr><td>Healthcare</td><td>Patient-service utilization groups</td></tr><tr><td>Manufacturing</td><td>Equipment operating profiles for maintenance</td></tr></tbody></table></div>' +
        '<p><strong>Advantages:</strong> efficient on large numeric data, produces profiles managers can act on. It works best when groups are reasonably <strong>compact</strong> after cleaning and standardization, and it is only useful if the business can explain and act on each segment.</p>'
    },
    {
      title: 'The process and the retail case', slides: '7–15',
      body: '<ol><li>Define a segmentation question.</li><li>Select records and numeric behavior features.</li><li>Clean data and treat extreme values.</li><li>Standardize comparable features.</li><li>Run K-means for several values of K.</li><li>Profile clusters and evaluate business usefulness.</li><li>Deploy the labels and monitor changes.</li></ol>' +
        '<div class="example"><span class="eyebrow">Case</span><p>An e-commerce retailer wants to group <b>5,000 loyalty customers</b> to target campaigns: high-value frequent, occasional, discount-oriented, and at-risk customers. No segment label exists, so this is unsupervised.</p></div>' +
        '<p>Each row = one customer over a defined <strong>12-month observation period</strong>. Features: annual spend, purchase frequency, average order value, discount usage rate, online purchase share, days since last purchase.</p>' +
        '<ul><li><strong>Do not use Customer ID as a feature.</strong> Keep it only to join labels back.</li><li>Check missing values, duplicate IDs, negative values, inconsistent currencies, extreme outliers.</li><li>Compare customers over the same observation period (a member who joined last week needs adjusting).</li><li>Use only information available before the segmentation date.</li><li>Fill missing online share with the median of comparable customers; winsorize or investigate extreme spend; convert currency and percentages to numbers.</li></ul>'
    },
    {
      title: 'Scaling and distance', slides: '16–18, 25–26',
      simple: 'K-means measures distance, so a column in thousands of pesos would swamp a column between 0 and 1. Convert everything to z-scores first.',
      body: '<div class="formula"><span class="eyebrow">Standardize, then measure distance</span><div class="f">z = (x − mean) ÷ SD</div><div class="f">d(A, B) = √[(A₁ − B₁)² + (A₂ − B₂)² + … + (Aₙ − Bₙ)²]</div><div style="font-size:.9rem">A smaller Euclidean distance means two customers are more similar across the chosen features.</div></div>' +
        '<div class="example"><span class="eyebrow">Standardized features (slide 18)</span><div class="tablebox"><table><thead><tr><th>Feature</th><th>Value</th><th>Mean</th><th>SD</th><th>z</th></tr></thead><tbody><tr><td>Annual spend</td><td>₱8,500</td><td>₱5,200</td><td>₱1,800</td><td>1.83</td></tr><tr><td>Purchases/month</td><td>12</td><td>7</td><td>2.5</td><td>2.00</td></tr><tr><td>Days since purchase</td><td>18</td><td>7</td><td>4</td><td>2.75</td></tr><tr><td>Online share</td><td>80%</td><td>65%</td><td>12%</td><td>1.25</td></tr></tbody></table></div><p>Spend: (8,500 − 5,200) ÷ 1,800 = 1.83 standard deviations above average.</p></div>' +
        '<h4>Feature relationships</h4><p>Strongly related features (e.g., total spend and purchase frequency) give the same behavior <strong>extra weight</strong> in the distance. Decide whether both add business meaning before including them. Correlation still doesn’t prove one behavior causes another.</p>',
      exam: 'Distance between (1.4, 1.3) and (−1.2, −1.0): √[(2.6)² + (2.3)²] = √(6.76 + 5.29) = √12.05 = 3.47.'
    },
    {
      title: 'The K-means algorithm', slides: '28–33',
      simple: 'Pick K. Drop K centers. Assign each point to its closest center. Move each center to the average of its points. Repeat until it stops moving.',
      body: '<ol><li><strong>Choose K</strong>, the number of clusters.</li><li><strong>Initialize</strong> K centroids.</li><li><strong>Assign</strong> each customer to the nearest centroid.</li><li><strong>Update</strong> each centroid to the mean of its assigned customers.</li><li><strong>Repeat</strong> assign and update until the centers no longer change materially.</li></ol>' +
        '<div class="example"><span class="eyebrow">Six customers, K = 3 (slides 29–32)</span><div class="tablebox"><table><thead><tr><th>Customer</th><th>Spend z</th><th>Frequency z</th><th>Cluster</th></tr></thead><tbody><tr><td>A</td><td>1.4</td><td>1.3</td><td>1 (high/high)</td></tr><tr><td>B</td><td>1.1</td><td>1.5</td><td>1</td></tr><tr><td>C</td><td>−1.2</td><td>−1.0</td><td>2 (low/low)</td></tr><tr><td>D</td><td>−1.5</td><td>−1.3</td><td>2</td></tr><tr><td>E</td><td>0.2</td><td>0.1</td><td>3 (moderate)</td></tr><tr><td>F</td><td>−0.1</td><td>0.3</td><td>3</td></tr></tbody></table></div>' +
        '<p>Updated centroids are the cluster means: C1 = ((1.4 + 1.1) ÷ 2, (1.3 + 1.5) ÷ 2) = <b>(1.25, 1.40)</b>; C2 = <b>(−1.35, −1.15)</b>; C3 = <b>(0.05, 0.20)</b>.</p></div>',
      exam: 'K-means results depend on the starting centroids; different starts can give different clusters. Libraries run several starts (n_init) and keep the one with the lowest inertia. K-means also assumes roughly round, similar-size clusters and is pulled by outliers, since centroids are means.',
      code: [{ t: 'K-means in sklearn', c: 'from sklearn.preprocessing import StandardScaler\nfrom sklearn.cluster import KMeans\nX = StandardScaler().fit_transform(df[features])\nkm = KMeans(n_clusters=3, n_init=10, random_state=42).fit(X)\ndf["segment"] = km.labels_\nprint(km.inertia_)' }]
    },
    {
      title: 'Choosing K: elbow and silhouette', slides: '34–41',
      simple: 'Inertia always drops as K grows, so look for the bend (the elbow). Silhouette near 1 means clean, separate groups.',
      body: '<p>K is both a business and an analytical decision. Test several values (K = 2 to 8) and choose a solution that is <strong>stable, interpretable and actionable</strong>.</p>' +
        '<div class="formula"><span class="eyebrow">Inertia</span><div class="f">Inertia = Σ (distance from each point to its centroid)²</div><div style="font-size:.9rem">Lower = tighter clusters. It <b>always decreases</b> as K increases, so never choose K by inertia alone. The <b>elbow</b> is where extra clusters stop giving much improvement.</div></div>' +
        '<div class="tablebox"><table><thead><tr><th>Inertia pattern</th><th>Decision</th></tr></thead><tbody><tr><td>Near 0</td><td>Suspicious: too many clusters or very few distinct records</td></tr><tr><td>High</td><td>Loose clusters: increase K, review outliers, standardize</td></tr><tr><td>Big drop when K rises</td><td>The new cluster may be a meaningful group</td></tr><tr><td>Small drop</td><td>Don’t add a segment without a business reason</td></tr><tr><td>Elbow point</td><td>Pick the smallest K at the elbow that is still actionable</td></tr></tbody></table></div>' +
        '<div class="formula"><span class="eyebrow">Silhouette score</span><div class="f">s = (b − a) ÷ max(a, b)</div><div style="font-size:.9rem">a = average distance to points in its own cluster; b = average distance to the nearest other cluster. Range −1 to 1.</div></div>' +
        '<div class="tablebox"><table><thead><tr><th>Silhouette</th><th>Structure</th><th>Business reading</th></tr></thead><tbody><tr><td>0.71–1.00</td><td>Very strong</td><td>Highly distinct groups</td></tr><tr><td>0.51–0.70</td><td>Good</td><td>Generally acceptable segmentation</td></tr><tr><td>0.26–0.50</td><td>Fair / weak</td><td>Use with caution; review variables or K</td></tr><tr><td>0.01–0.25</td><td>Very weak</td><td>Segments may not be distinct enough</td></tr><tr><td>0.00</td><td>On the border</td><td>Could belong to either cluster</td></tr><tr><td>&lt; 0</td><td>Misassigned</td><td>Reassess K, preparation or method</td></tr></tbody></table></div>'
    },
    {
      title: 'Profiling and naming clusters', slides: '42–45',
      body: '<p>Cluster labels become useful only after <strong>profiling</strong>: compare average feature values and sizes, then the business assigns descriptive names.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Cluster (K = 3)</th><th>Customers</th><th>Spend</th><th>Purchases</th><th>Online</th><th>Action</th></tr></thead><tbody><tr><td><b>High-Value Loyalists</b></td><td>1,120</td><td>$3,850</td><td>38</td><td>78%</td><td>Premium loyalty offers (retention)</td></tr><tr><td><b>Low-Engagement</b></td><td>1,540</td><td>$540</td><td>6</td><td>41%</td><td>Reactivation campaign</td></tr><tr><td><b>Digital Regulars</b></td><td>2,340</td><td>$1,620</td><td>21</td><td>89%</td><td>Digital bundle offers (growth)</td></tr></tbody></table></div>' +
        '<p>K-means receives the <strong>standardized matrix</strong> (spend z, frequency z, order z, online z), never raw labels.</p>' +
        '<h4>Validation</h4><p>There is no target to score against, so use a development sample to compare K, then confirm the clusters stay <strong>stable</strong> on a holdout sample or a later customer period. Report only once profiles are stable and understandable.</p>'
    },
    {
      title: 'PCA for visualizing clusters', slides: '46–61',
      body: '<p><strong>Principal Component Analysis (PCA)</strong> transforms high-dimensional data into fewer dimensions while keeping as much information (variance) as possible. With many features you can’t plot clusters directly; PCA projects them onto 2 axes (PC1, PC2).</p>' +
        '<p>The wine example: scale the features (leave the label column out), run the elbow method, fit K-means with 3 clusters, reduce the data <em>and</em> the cluster centers to 2 principal components, then color the PC1–PC2 scatter by <code>kmeans.labels_</code>.</p>' +
        '<ul><li><code>components_</code> are the principal axes, the directions of maximum variance, sorted by <code>explained_variance_</code>.</li><li>To actually reduce size, the number of components kept should be much smaller than the original number of variables.</li><li>Loadings show which original features drive each component.</li></ul>',
      code: [{ t: 'PCA plot of clusters', c: 'from sklearn.decomposition import PCA\npca = PCA(n_components=2)\nX2 = pca.fit_transform(X)\ncenters2 = pca.transform(km.cluster_centers_)\nplt.scatter(X2[:,0], X2[:,1], c=km.labels_)\nplt.scatter(centers2[:,0], centers2[:,1], marker="X", s=200)\nprint(pca.explained_variance_ratio_)' }]
    }
  ],
  traps: [
    { errata: true, slide: 'slides 56–57', title: 'The wine data has 13 features, not 15', text: 'The slides say PCA reduces "from 15 features to 2". The standard wine dataset used here has <strong>13 chemical features</strong> plus the Customer_Segment label. The idea is the same: many features down to 2 components.' },
    { title: 'Clustering is not classification', text: 'K-means has no target label and returns segment IDs. Classification (M8) learns from known labels and predicts them.' },
    { title: 'Always standardize first', text: 'Without z-scores, the feature with the biggest units (annual spend in pesos) dominates the distance and the clusters.' },
    { title: 'Inertia alone always says "more clusters"', text: 'Inertia keeps falling as K rises (K = n gives 0). Use the elbow plus silhouette plus business usefulness.' },
    { title: 'Silhouette signs', text: 'Near 1 = clear separation. Near 0 = on a border. Negative = probably in the wrong cluster.' },
    { title: 'Never cluster on IDs', text: 'Customer ID is not behavior. Exclude it from features and use it only to join labels back.' },
    { title: 'The model doesn’t name segments', text: 'K-means outputs Cluster 1, 2, 3. People name them ("High-Value Loyalists") after profiling the averages.' }
  ],
  quiz: [
    { type: 'mcq', topic: 'Concept', q: 'K-means clustering is an example of…', options: ['Supervised learning', 'Unsupervised learning', 'Time-series forecasting', 'Association rule mining'], answer: 1, why: ['Supervised learning needs a target label.', 'Correct: no target; it finds natural groups.', 'Forecasting predicts future values of a series.', 'Association rules find co-occurring items.'] },
    { type: 'num', topic: 'Scaling', q: 'Annual spend ₱8,500, mean ₱5,200, SD ₱1,800. What is the z-score? (two decimals)', answer: 1.83, tol: 0.01, explain: '(8,500 − 5,200) ÷ 1,800 = 1.83.' },
    { type: 'num', topic: 'Scaling', q: 'Days since last purchase = 18, mean 7, SD 4. z-score?', answer: 2.75, tol: 0.01, explain: '(18 − 7) ÷ 4 = 2.75.' },
    { type: 'num', topic: 'Distance', q: 'Euclidean distance between A (1.4, 1.3) and C (−1.2, −1.0)? (two decimals)', answer: 3.47, tol: 0.01, explain: '√[(2.6)² + (2.3)²] = √12.05 = 3.47.' },
    { type: 'num', topic: 'Algorithm', q: 'Cluster 1 contains A (1.4, 1.3) and B (1.1, 1.5). What is the updated centroid’s spend z (first coordinate)?', answer: 1.25, tol: 0.001, explain: '(1.4 + 1.1) ÷ 2 = 1.25.' },
    { type: 'mcq', topic: 'Algorithm', q: 'After assigning customers to the nearest centroid, K-means next…', options: ['Picks a new K', 'Recalculates each centroid as the mean of its assigned customers', 'Removes outliers', 'Computes the silhouette score'], answer: 1, why: ['K is fixed for the run.', 'Correct: the update step.', 'Outlier treatment happens in preparation.', 'Silhouette is an evaluation after clustering.'] },
    { type: 'mcq', topic: 'Scaling', q: 'Why standardize before K-means?', options: ['K-means needs categorical data', 'So large-unit features don’t dominate the distance', 'To create the target label', 'To reduce the number of rows'], answer: 1, why: ['K-means needs numeric features.', 'Correct: distance is scale-sensitive.', 'There is no target in clustering.', 'Standardizing doesn’t change the row count.'] },
    { type: 'mcq', topic: 'Choosing K', q: 'Inertia keeps decreasing as K goes from 2 to 8. What does that tell you?', options: ['K = 8 is best', 'Nothing by itself; inertia always decreases as K grows', 'The data cannot be clustered', 'Silhouette must be negative'], answer: 1, why: ['More clusters always lower inertia; that doesn’t make them useful.', 'Correct: look for the elbow and check silhouette and business sense.', 'Decreasing inertia is the normal pattern.', 'Inertia and silhouette are separate measures.'] },
    { type: 'mcq', topic: 'Choosing K', q: 'A silhouette score of 0.62 indicates…', options: ['Very strong structure', 'Good structure, generally acceptable', 'Very weak structure', 'Wrong assignments'], answer: 1, why: ['Very strong is 0.71–1.00.', 'Correct: 0.51–0.70 is good.', 'Very weak is 0.01–0.25.', 'That would be negative.'] },
    { type: 'mcq', topic: 'Choosing K', q: 'Some customers have negative silhouette values. What does it suggest?', options: ['They are perfectly clustered', 'They may be assigned to the wrong cluster', 'K is too small by exactly one', 'The data were not encoded'], answer: 1, why: ['Perfect would be close to 1.', 'Correct: they are closer to a neighboring cluster.', 'It suggests reassessing K but doesn’t give the exact fix.', 'Encoding isn’t what a negative silhouette indicates.'] },
    { type: 'mcq', topic: 'Features', q: 'Which should NOT be used as a clustering feature?', options: ['Annual spend', 'Online purchase share', 'Customer ID', 'Days since last purchase'], answer: 2, why: ['Spend is behavior.', 'Online share is behavior.', 'Correct: an ID is a label, not behavior. Keep it only for joining.', 'Recency is behavior.'] },
    { type: 'mcq', topic: 'Profiling', q: 'A cluster has low spend, few purchases and long recency. A sensible action is…', options: ['Premium loyalty offers', 'A reactivation campaign', 'Digital bundle offers', 'No action is possible'], answer: 1, why: ['That suits High-Value Loyalists.', 'Correct: these are low-engagement customers.', 'That suits Digital Regulars.', 'Segments are made to guide action.'] },
    { type: 'mcq', topic: 'PCA', q: 'In the wine example, PCA is used to…', options: ['Choose the number of clusters', 'Project many features onto 2 components to visualize the clusters', 'Replace K-means', 'Remove outliers'], answer: 1, why: ['The elbow method chooses K.', 'Correct: it keeps as much variance as possible in fewer dimensions.', 'K-means still forms the clusters.', 'PCA is not an outlier method.'] },
    { type: 'tf', topic: 'Concept', q: 'K-means gives each customer a predicted class from a known set of labels, like "churn" or "stay".', answer: 1, explain: 'False. It gives a segment ID; there are no known labels. That describes classification.' },
    { type: 'tf', topic: 'Validation', q: 'Because clustering has no target, you validate it by checking that clusters remain stable on a holdout sample or a later period.', answer: 0, explain: 'True. Stability plus interpretability replaces accuracy.' }
  ],
  cards: [
    ['Supervised or unsupervised: K-means?', 'Unsupervised: no target label.', ''],
    ['Five K-means steps?', 'Choose K → initialize centroids → assign to nearest → update centroids as means → repeat until stable.', ''],
    ['What is a centroid?', 'The center of a cluster: the mean of its members’ feature values.', ''],
    ['Euclidean distance formula?', '√[Σ(Aᵢ − Bᵢ)²]', ''],
    ['Inertia?', 'Sum of squared distances from each point to its centroid. Always falls as K rises.', ''],
    ['Elbow method?', 'Plot inertia vs K; pick the K where improvement flattens.', ''],
    ['Silhouette near 1, 0, negative?', 'Well separated · on a border · probably misassigned.', ''],
    ['Good silhouette range?', '0.51–0.70 good; 0.71+ very strong.', ''],
    ['Why exclude Customer ID?', 'It’s a label, not behavior; it would distort distances.', ''],
    ['What does PCA do?', 'Reduces many features to a few components that keep the most variance, for plotting.', '']
  ],
  cheat: '<div class="card stack"><h3>Algorithm</h3><p>Choose K → init centroids → assign nearest → update = mean → repeat until stable</p></div>' +
    '<div class="card stack"><h3>Prep</h3><p>One period per customer · no IDs as features · treat outliers · z = (x − mean) ÷ SD on every feature</p></div>' +
    '<div class="card stack"><h3>Distance</h3><p>d = √Σ(Aᵢ − Bᵢ)². Smaller = more similar.</p></div>' +
    '<div class="card stack"><h3>Choosing K</h3><p>Inertia = Σ d² to centroid (always ↓ with K) → elbow<br>Silhouette s = (b − a) ÷ max(a, b)</p></div>' +
    '<div class="card stack"><h3>Silhouette bands</h3><p>0.71–1 very strong · 0.51–0.70 good · 0.26–0.50 fair · 0.01–0.25 very weak · 0 border · &lt;0 misassigned</p></div>' +
    '<div class="card stack"><h3>Profiles (K = 3)</h3><p>High-Value Loyalists → retention · Low-Engagement → reactivation · Digital Regulars → digital growth</p></div>' +
    '<div class="card stack"><h3>PCA</h3><p>Many features → 2 components (max variance) to plot clusters; color by labels_.</p></div>'
});
