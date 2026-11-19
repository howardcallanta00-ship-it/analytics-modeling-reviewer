(window.REVIEWER = window.REVIEWER || { modules: [] }).modules.push({
  id: 'm5', num: 5, title: 'Association Rule Mining', short: 'Association',
  blurb: 'Support, confidence, lift, Apriori and FP-Growth on shopping baskets.',
  steps: [1, 2, 3, 5, 6, 7],
  pipelineNote: 'The pipeline again, adapted: the "model" is a set of mined rules, Step 6 (Assess) uses support, confidence and lift, and validation is time-based: mine on earlier months, check the rules still hold later.',
  thirty: 'Association rules find items people buy together. <mark>Support</mark> asks how often, <mark>confidence</mark> asks how reliably, and <mark>lift</mark> asks whether it beats pure chance.',
  analogy: 'It is the engine behind "customers who bought this also bought…", shelf placement and bundle promos.',
  objectives: ['Explain association rules using supermarket transactions.', 'Prepare and encode transaction data into baskets.', 'Compute support, confidence and lift and interpret them in business terms.', 'Apply Apriori step by step, including pruning.', 'Explain how FP-Growth builds and mines an FP-tree.', 'Set business thresholds, validate rules over time and report them.'],
  lessons: [
    {
      title: 'Rules: A → B', slides: '3–10',
      simple: 'A rule says: when a basket has A, it often also has B. It describes what happens together, not what causes what.',
      body: '<p><strong>Association rule mining</strong> finds products that customers buy together. Supermarkets use the patterns for cross-selling, bundles, shelf placement and promotions. It is <strong>cost-effective</strong>, since point-of-sale systems already record the data.</p>' +
        '<div class="formula"><span class="eyebrow">Rule form</span><div class="f">A → B</div><div style="font-size:.95rem"><b>A, the antecedent</b> (left side): items already in the basket. <b>B, the consequent</b> (right side): an item that may appear with A. Example: {Pasta, Pasta Sauce} → {Parmesan}.</div></div>' +
        '<p>An <strong>itemset</strong> is a collection of items bought together. The <strong>unit of analysis</strong> is one completed shopping basket.</p>' +
        '<p>Business users: category managers choose bundles; merchandisers plan shelf adjacency; marketing targets coupons; store managers check whether actions raise basket value.</p>' +
        '<div class="analogy"><strong>A rule is an observed purchase relationship, not a causal effect.</strong></div>'
    },
    {
      title: 'Preparing basket data', slides: '7, 11–17',
      body: '<p>Process: define a basket-based business question → prepare transactions → explore item frequency and co-purchases → mine candidate rules → assess rules and report actions.</p>' +
        '<p>Each record needs a <strong>transaction ID</strong> and the <strong>products</strong> in it (plus date, store, SKU, category, quantity when useful). The algorithm uses the item <em>set</em>, not the order of rows.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Step</th><th>Example from the slides</th><th>Why</th></tr></thead><tbody><tr><td>Remove cancelled transactions</td><td>Drop the cancelled T004 Pasta line</td><td>It was never purchased</td></tr><tr><td>Remove duplicate line items</td><td>Keep one Pasta in T004</td><td>Rules use item <em>presence</em></td></tr><tr><td>Standardize names</td><td>"pasta" → Pasta, "Milk 1L" → Milk</td><td>One item, one label</td></tr><tr><td>Choose product level</td><td>"Parmesan Cheese" → Parmesan (SKU, brand or category?)</td><td>Easier for managers to read</td></tr><tr><td>Filter the period</td><td>Keep 1–3 June</td><td>A defined business period</td></tr><tr><td>Group into baskets</td><td>T003 → {Bread, Butter, Milk}</td><td>One transaction = one basket</td></tr></tbody></table></div>' +
        '<div class="example"><span class="eyebrow">The 5 clean baskets used all module</span><p>T001 {Bread, Milk, Eggs} · T002 {Pasta, Sauce, Parmesan} · T003 {Bread, Butter, Milk} · T004 {Pasta, Sauce} · T005 {Bread, Milk, Butter}</p></div>' +
        '<p><strong>Transaction encoding</strong> turns each basket into a row of 1s (item present) and 0s (absent). Quantity becomes 1 when the question is just whether the item appeared.</p>' +
        '<h4>Explore before mining</h4><p>Check transaction count, basket size, top items and item-pair frequency. <strong>Very common items</strong> produce trivial rules; <strong>very rare items</strong> produce unstable ones.</p>',
      code: [{ t: 'Encode baskets with mlxtend', c: 'from mlxtend.preprocessing import TransactionEncoder\nbaskets = [["Bread","Milk","Eggs"], ["Pasta","Sauce","Parmesan"],\n           ["Bread","Butter","Milk"], ["Pasta","Sauce"], ["Bread","Milk","Butter"]]\nte = TransactionEncoder()\nonehot = pd.DataFrame(te.fit_transform(baskets), columns=te.columns_)' }]
    },
    {
      title: 'Support', slides: '29, 53–55',
      simple: 'Support is the share of all baskets that contain the whole itemset. It tells you how many shoppers a promo could reach.',
      body: '<div class="formula"><span class="eyebrow">Formula</span><div class="f">Support(A → B) = count(A and B together) ÷ total transactions</div></div>' +
        '<div class="example"><span class="eyebrow">From the 5 baskets</span><div class="tablebox"><table><thead><tr><th>Itemset</th><th>Baskets</th><th>Support</th></tr></thead><tbody><tr><td>{Bread, Milk}</td><td>3 of 5</td><td>60%</td></tr><tr><td>{Pasta, Sauce}</td><td>2 of 5</td><td>40%</td></tr><tr><td>{Bread, Milk, Butter}</td><td>2 of 5</td><td>40%</td></tr><tr><td>{Milk, Eggs}</td><td>1 of 5</td><td>20% (below a 40% threshold, pruned)</td></tr></tbody></table></div></div>' +
        '<div class="tablebox"><table><thead><tr><th>Support range</th><th>Reading for a supermarket</th></tr></thead><tbody><tr><td>Below 1%</td><td>Very rare; only niche or high-margin items</td></tr><tr><td>1–5%</td><td>Low; targeted promos for some stores or segments</td></tr><tr><td>5–15%</td><td>Moderate; test cross-selling or shelf placement</td></tr><tr><td>15–30%</td><td>High; broad store-level promotions</td></tr><tr><td>Above 30%</td><td>Very high; check it’s not just popular staples</td></tr></tbody></table></div>' +
        '<p>Low support can make a rule too narrow for a storewide campaign.</p>'
    },
    {
      title: 'Confidence', slides: '30, 56–58',
      simple: 'Of the baskets that have A, what share also have B?',
      body: '<div class="formula"><span class="eyebrow">Formula</span><div class="f">Confidence(A → B) = count(A and B) ÷ count(A)</div></div>' +
        '<div class="example"><span class="eyebrow">From the 5 baskets</span><div class="tablebox"><table><thead><tr><th>Rule</th><th>Baskets with A</th><th>With A and B</th><th>Confidence</th></tr></thead><tbody><tr><td>Bread → Milk</td><td>3</td><td>3</td><td>100%</td></tr><tr><td>Pasta → Sauce</td><td>2</td><td>2</td><td>100%</td></tr><tr><td>{Bread, Milk} → Butter</td><td>3</td><td>2</td><td>66.7%</td></tr><tr><td>Milk → Eggs</td><td>3</td><td>1</td><td>33.3%</td></tr></tbody></table></div></div>' +
        '<div class="tablebox"><table><thead><tr><th>Confidence</th><th>Reading</th></tr></thead><tbody><tr><td>Below 30%</td><td>Weak; usually unsuitable for a promo</td></tr><tr><td>30–50%</td><td>Moderate; only for high margin or a specific segment</td></tr><tr><td>50–70%</td><td>Good; test a coupon, bundle or adjacency</td></tr><tr><td>70–90%</td><td>Strong; targeted offers</td></tr><tr><td>Above 90%</td><td>Very strong; check lift first, B may just be very common</td></tr></tbody></table></div>' +
        '<p>Confidence is <strong>directional</strong>: Confidence(A → B) usually differs from Confidence(B → A). High confidence alone can mislead when B is bought by almost everyone.</p>'
    },
    {
      title: 'Lift', slides: '31–32, 59–62',
      simple: 'Lift tells you if two items really "go together" or just look like it because one is popular. Above 1 means buying A makes B more likely than usual.',
      body: '<div class="formula"><span class="eyebrow">Formula</span><div class="f">Lift(A → B) = Confidence(A → B) ÷ Support(B)</div><div style="font-size:.9rem">Equivalent: Support(A and B) ÷ [Support(A) × Support(B)]. It compares the rule with what you’d expect if A and B were independent.</div></div>' +
        '<div class="example"><span class="eyebrow">Worked (slide 62)</span><p>{Bread, Milk} in 3 of 5 baskets → support 60%. Bread in 3 baskets → confidence(Bread → Milk) = 3/3 = 100%. Support(Milk) = 3/5 = 60%. <b>Lift = 1.00 ÷ 0.60 = 1.67.</b></p><p>Pasta → Sauce: confidence 100%, Support(Sauce) 40% → <b>lift 2.50</b>, the strongest rule.</p></div>' +
        '<div class="tablebox"><table><thead><tr><th>Lift</th><th>Meaning</th><th>Action</th></tr></thead><tbody><tr><td>&lt; 1.00</td><td>Negative association</td><td>Don’t bundle</td></tr><tr><td>= 1.00</td><td>Independent, no association</td><td>No cross-sell value</td></tr><tr><td>1.01–1.20</td><td>Weak positive</td><td>Only cheap changes on high-volume items</td></tr><tr><td>1.21–1.50</td><td>Moderate positive</td><td>Targeted coupons, placement tests</td></tr><tr><td>1.51–2.00</td><td>Strong positive</td><td>Prioritize promo testing</td></tr><tr><td>&gt; 2.00</td><td>Very strong positive</td><td>High-potential bundle; confirm support first</td></tr></tbody></table></div>',
      exam: 'Lift is symmetric: Lift(A → B) = Lift(B → A). Milk → Eggs has lift 1.67 but only 20% support; with a 40% minimum, it reaches too few baskets for a broad campaign. Always read lift together with support.'
    },
    {
      title: 'Apriori step by step', slides: '23–43',
      simple: 'Count single items, keep the frequent ones, pair them up, keep frequent pairs, build triples, and so on. Anything containing an infrequent piece is skipped.',
      body: '<div class="formula"><span class="eyebrow">Apriori property</span><div style="font-size:1rem">If an itemset is infrequent, <b>every larger itemset containing it is also infrequent</b>. So Apriori never counts candidates that can’t reach minimum support.</div></div>' +
        '<p>Two phases: <strong>frequent itemset generation</strong>, then <strong>rule generation</strong>. Minimum support here = 40% = 2 of 5 baskets.</p>' +
        '<div class="example"><span class="eyebrow">Step 1 · 1-itemsets</span><p>Bread 3 (60%) ✓ · Milk 3 ✓ · Butter 2 (40%) ✓ · Pasta 2 ✓ · Sauce 2 ✓ · Eggs 1 (20%) ✗ · Parmesan 1 ✗</p></div>' +
        '<div class="example"><span class="eyebrow">Step 2 · 2-itemsets from frequent items</span><p>{Bread, Milk} 3 ✓ · {Bread, Butter} 2 ✓ · {Milk, Butter} 2 ✓ · {Pasta, Sauce} 2 ✓ · all other pairs &lt; 2 ✗</p></div>' +
        '<div class="example"><span class="eyebrow">Step 3 · 3-itemsets</span><p>{Bread, Milk, Butter}: all three pairs are frequent → count = 2 → keep (40%).<br>{Bread, Milk, Eggs}: {Milk, Eggs} is infrequent → <b>pruned before counting</b>.<br>No larger itemset reaches 40%, so Apriori stops.</p></div>' +
        '<h4>Rule generation</h4><p>For each frequent itemset, choose a non-empty subset as the antecedent; the rest is the consequent. Keep rules that meet the support, confidence and lift thresholds. From {Bread, Milk, Butter}: {Bread, Milk} → Butter, {Butter} → {Bread, Milk}, and so on.</p>',
      code: [{ t: 'Apriori with mlxtend', c: 'from mlxtend.frequent_patterns import apriori, association_rules\nfreq = apriori(onehot, min_support=0.4, use_colnames=True)\nrules = association_rules(freq, metric="lift", min_threshold=1.0)\nprint(rules[["antecedents","consequents","support","confidence","lift"]])' }]
    },
    {
      title: 'FP-Growth', slides: '44–51, 70',
      body: '<p><strong>FP-Growth</strong> avoids generating large numbers of candidates. It compresses transactions into an <strong>FP-tree</strong> where shared prefixes share a path, then mines <strong>conditional pattern bases</strong>.</p>' +
        '<ol><li><strong>Count and order:</strong> drop items below minimum support (Eggs, Parmesan), then sort the rest from most to least frequent, using one global order in every transaction: Bread, Milk, Butter, Pasta, Sauce.</li><li><strong>Build the tree:</strong> insert each ordered transaction. T001 → root → Bread → Milk. T003 and T005 add → Bread → Milk → Butter, raising counts to Bread 3, Milk 3, Butter 2. T002 and T004 build root → Pasta → Sauce (2). A <strong>header table</strong> links all nodes of the same item.</li><li><strong>Mine:</strong> start from a suffix item, collect its conditional pattern base, build a conditional tree, and recurse. Butter’s base is {Bread, Milk}: 2 → frequent itemset {Bread, Milk, Butter}. Sauce’s base is {Pasta}: 2 → {Pasta, Sauce}.</li></ol>' +
        '<p>Result: <strong>the same frequent itemsets as Apriori</strong>, without generating every candidate pair or triple.</p>' +
        '<div class="tablebox"><table><thead><tr><th></th><th>Apriori</th><th>FP-Growth</th></tr></thead><tbody><tr><td>Method</td><td>Candidate generation and pruning</td><td>Compact tree and conditional patterns</td></tr><tr><td>Strength</td><td>Simple; good for teaching and small data</td><td>Efficient on large or dense data</td></tr><tr><td>Main cost</td><td>Many candidate itemsets, repeated scans</td><td>Tree construction and traversal</td></tr><tr><td>Output</td><td>Frequent itemsets and rules</td><td>Same</td></tr></tbody></table></div>'
    },
    {
      title: 'Thresholds, validation and reporting', slides: '22, 63–73',
      body: '<ul><li>Set <strong>minimum support</strong> for reach, <strong>minimum confidence</strong> for reliability, <strong>minimum lift</strong> for association beyond chance.</li><li>Then check <strong>margin, stock availability and promotion cost</strong>. A rule can be statistically strong but commercially weak.</li><li>Estimate eligible baskets, expected margin, discount cost and inventory impact before acting.</li></ul>' +
        '<h4>Time-based validation</h4><div class="tablebox"><table><thead><tr><th>Purpose</th><th>Period</th><th>Transactions</th><th>Use</th></tr></thead><tbody><tr><td>Discovery</td><td>January–March</td><td>24,000</td><td>Mine candidate rules</td></tr><tr><td>Validation</td><td>April</td><td>8,100</td><td>Check stability</td></tr><tr><td>Reporting</td><td>May</td><td>8,400</td><td>Monitor business results</td></tr></tbody></table></div>' +
        '<p>A rule that only appears during one short promotion may not generalize. Inspect sample baskets to confirm a rule makes practical sense.</p>' +
        '<h4>Common pitfalls</h4><ul><li>Treating association as causation.</li><li>Mining too many weak rules.</li><li>A threshold that ignores business reach.</li><li>Keeping promotion-driven rules after the promotion ends.</li></ul>' +
        '<div class="example"><span class="eyebrow">Report template (slide 72)</span><p><b>Question:</b> Which combinations support cross-selling? <b>Rule:</b> Pasta → Pasta Sauce. <b>Assessment:</b> support 40%, confidence 100%, lift 2.50. <b>Action:</b> test co-location in selected stores. <b>Limitation:</b> the association does not prove incremental demand.</p></div>'
    }
  ],
  traps: [
    { errata: true, slide: 'slide 29', title: 'Support is not "the probability of the antecedent"', text: 'Slide 29 defines support as the probability of the antecedent and says below 50% is "less fruitful". Correct: support is the share of <strong>all</strong> transactions containing the <strong>whole itemset</strong> (A and B). The module’s own range table (slide 54) treats 5–15% as a workable range for supermarkets.' },
    { errata: true, slide: 'slide 35', title: 'Binary basket matrix is missing Butter', text: 'Slide 35’s matrix drops the Butter column, so T003 and T005 look like {Bread, Milk}. Use slide 17’s full matrix, where both include Butter.' },
    { errata: true, slide: 'slides 27–31', title: 'A different example sneaks in', text: 'These slides describe "mobile phone and screen guard" in 3 of 5 transactions, a dataset never shown. Work exam problems with the supermarket baskets instead.' },
    { title: 'Confidence alone misleads', text: 'If almost every basket has Milk, any rule ending in Milk looks reliable. Lift corrects for how popular B already is.' },
    { title: 'Confidence is directional, lift is not', text: 'Confidence(A → B) = count(A,B) ÷ count(A). Confidence(B → A) divides by count(B) instead. Lift is the same in both directions.' },
    { title: 'Lift needs reach', text: 'Milk → Eggs has lift 1.67, but support 20%. Under a 40% threshold it is too narrow for a storewide campaign.' },
    { title: 'Association ≠ causation', text: 'Pasta buyers often buy sauce, but a sauce coupon may not cause extra pasta sales. Test the action and measure the incremental margin.' }
  ],
  quiz: [
    { type: 'mcq', topic: 'Rules', q: 'In the rule {Pasta, Pasta Sauce} → {Parmesan}, the antecedent is…', options: ['{Parmesan}', '{Pasta, Pasta Sauce}', '{Pasta, Pasta Sauce, Parmesan}', 'The confidence'], answer: 1, why: ['That is the consequent (right side).', 'Correct: items already in the basket (left side).', 'That is the whole itemset.', 'Confidence is a metric, not part of the rule.'] },
    { type: 'num', topic: 'Support', q: 'Out of 5 baskets, {Bread, Milk} appears in 3. What is its support (%)?', answer: 60, tol: 0.1, unit: '%', explain: '3 ÷ 5 = 60%.' },
    { type: 'num', topic: 'Confidence', q: '{Bread, Milk} appears in 3 baskets; {Bread, Milk, Butter} appears in 2. Confidence of {Bread, Milk} → Butter (%)? (one decimal)', answer: 66.7, tol: 0.1, unit: '%', explain: '2 ÷ 3 = 66.7%.' },
    { type: 'num', topic: 'Lift', q: 'Confidence(Pasta → Sauce) = 100% and Support(Sauce) = 40%. What is the lift?', answer: 2.5, tol: 0.01, explain: '1.00 ÷ 0.40 = 2.50.' },
    { type: 'num', topic: 'Lift', q: 'Confidence(Bread → Milk) = 100% and Support(Milk) = 60%. Lift? (two decimals)', answer: 1.67, tol: 0.01, explain: '1.00 ÷ 0.60 = 1.67.' },
    { type: 'mcq', topic: 'Lift', q: 'A rule has lift = 1.00. This means…', options: ['A strong positive association', 'A and B are independent; no association', 'A negative association', 'The rule has 100% confidence'], answer: 1, why: ['Positive association needs lift > 1.', 'Correct: buying A doesn’t change the chance of buying B.', 'Negative association means lift < 1.', 'Lift and confidence are different measures.'] },
    { type: 'mcq', topic: 'Lift', q: 'Minimum support is 40%. Milk → Eggs has confidence 33.3%, and Eggs appear in 20% of baskets. Best conclusion?', options: ['Lift 0.60, avoid bundling', 'Lift 1.67, launch a storewide promo', 'Lift 1.67, positive but too little reach for a storewide promo', 'Lift = confidence = 33.3%'], answer: 2, why: ['0.60 is Support ÷ Confidence, upside down.', 'The lift is right, but {Milk, Eggs} is in only 20% of baskets, below 40%.', 'Correct: 0.333 ÷ 0.20 = 1.67, but support is too low.', 'Lift and confidence answer different questions.'] },
    { type: 'mcq', topic: 'Apriori', q: 'Why can Apriori skip counting {Bread, Milk, Eggs}?', options: ['Bread is too frequent', 'Its subset {Milk, Eggs} is infrequent', 'Three-item sets are never counted', 'Eggs appears in every basket'], answer: 1, why: ['Frequent items are kept, not skipped.', 'Correct: the Apriori property. A superset of an infrequent set is infrequent.', 'Apriori does count 3-itemsets whose subsets are all frequent.', 'Eggs appears in only 1 of 5.'] },
    { type: 'mcq', topic: 'Apriori', q: 'With minimum support 40% on the 5 baskets, which is the only frequent 3-itemset?', options: ['{Pasta, Sauce, Parmesan}', '{Bread, Milk, Eggs}', '{Bread, Milk, Butter}', '{Bread, Butter, Pasta}'], answer: 2, why: ['Only 1 basket (20%), and Parmesan is infrequent.', 'Pruned: {Milk, Eggs} is infrequent.', 'Correct: in T003 and T005 → 40%.', 'Never occurs together.'] },
    { type: 'mcq', topic: 'FP-Growth', q: 'What is FP-Growth’s main advantage over Apriori?', options: ['It produces different rules', 'It avoids generating large numbers of candidate itemsets', 'It needs no minimum support', 'It proves causation'], answer: 1, why: ['It finds the same frequent itemsets.', 'Correct: it compresses data into an FP-tree and mines conditional patterns.', 'It still uses minimum support.', 'No rule-mining method proves causation.'] },
    { type: 'mcq', topic: 'FP-Growth', q: 'In FP-Growth step 1, items are ordered…', options: ['Alphabetically', 'From most to least frequent, in one global order', 'By price', 'Randomly per transaction'], answer: 1, why: ['Alphabetical order doesn’t maximize shared prefixes.', 'Correct: so transactions share prefixes and the tree stays compact.', 'Price is irrelevant to the algorithm.', 'The same order must be used in every transaction.'] },
    { type: 'mcq', topic: 'Data prep', q: 'T004 contains a cancelled Pasta line and a duplicate Pasta line. What do you do?', options: ['Keep both', 'Remove the cancelled line and keep one Pasta', 'Remove the whole transaction', 'Count Pasta twice for stronger support'], answer: 1, why: ['A cancelled item wasn’t purchased, and duplicates inflate counts.', 'Correct: rules use item presence per basket.', 'The completed items are still a valid basket.', 'Support counts baskets, not lines.'] },
    { type: 'mcq', topic: 'Validation', q: 'A strong rule appears only during a two-week promotion. What should you do?', options: ['Roll it out permanently', 'Validate it on a later, held-out period before acting', 'Raise the confidence threshold', 'Switch to FP-Growth'], answer: 1, why: ['It may not generalize beyond the promotion.', 'Correct: time-based validation checks stability.', 'Thresholds don’t fix a time-limited pattern.', 'The algorithm choice doesn’t change the data.'] },
    { type: 'tf', topic: 'Confidence', q: 'Confidence(Bread → Milk) is always equal to Confidence(Milk → Bread).', answer: 1, explain: 'False. Confidence divides by the antecedent’s count, so it is directional. (Here both happen to be 100%, but in general they differ.) Lift is the symmetric one.' },
    { type: 'tf', topic: 'Business', q: 'A rule with high support, confidence and lift should be acted on without checking margins or promotion costs.', answer: 1, explain: 'False. A rule can be statistically strong but commercially weak. Check margin, stock and discount cost.' }
  ],
  cards: [
    ['Antecedent vs consequent?', 'Antecedent = left side (A, already in basket). Consequent = right side (B).', ''],
    ['Support formula?', 'count(A and B) ÷ total transactions', 'Measures reach.'],
    ['Confidence formula?', 'count(A and B) ÷ count(A)', 'Directional.'],
    ['Lift formula?', 'Confidence(A → B) ÷ Support(B)', 'Symmetric.'],
    ['Lift < 1, = 1, > 1?', 'Negative association · independence · positive association.', ''],
    ['Apriori property?', 'If an itemset is infrequent, all its supersets are infrequent.', 'Lets Apriori prune candidates before counting.'],
    ['Best rule in the 5-basket example?', 'Pasta → Sauce: support 40%, confidence 100%, lift 2.50.', ''],
    ['FP-Growth in one line?', 'Compress baskets into an FP-tree, then mine conditional pattern bases; no candidate explosion.', ''],
    ['How to validate rules?', 'Mine on an earlier period, check they hold on a later held-out period.', ''],
    ['Four pitfalls?', 'Causation claims, too many weak rules, thresholds ignoring reach, keeping promo-only rules.', '']
  ],
  cheat: '<div class="card stack"><h3>Metrics</h3><p><b>Support</b> = n(A∧B) ÷ N (reach)<br><b>Confidence</b> = n(A∧B) ÷ n(A) (reliability, directional)<br><b>Lift</b> = Conf ÷ Supp(B) (vs chance, symmetric)</p></div>' +
    '<div class="card stack"><h3>Lift reading</h3><p>&lt;1 negative · =1 none · 1.01–1.20 weak · 1.21–1.50 moderate · 1.51–2.00 strong · &gt;2 very strong</p></div>' +
    '<div class="card stack"><h3>5 baskets</h3><p>T1 Bread Milk Eggs · T2 Pasta Sauce Parmesan · T3 Bread Butter Milk · T4 Pasta Sauce · T5 Bread Milk Butter</p></div>' +
    '<div class="card stack"><h3>Key results (min supp 40%)</h3><p>Bread→Milk 60% · 100% · 1.67<br>Pasta→Sauce 40% · 100% · 2.50 ★<br>{Bread,Milk}→Butter 40% · 66.7% · 1.67<br>Milk→Eggs 20% · 33.3% · 1.67 (too little reach)</p></div>' +
    '<div class="card stack"><h3>Apriori</h3><p>L1 → C2 → L2 → C3 (prune if any subset infrequent) → … → rules. Frequent 3-set: {Bread, Milk, Butter}.</p></div>' +
    '<div class="card stack"><h3>FP-Growth</h3><p>Count & order items → build FP-tree (shared prefixes, header table) → mine conditional pattern bases per suffix.</p></div>' +
    '<div class="card stack"><h3>Prep</h3><p>Drop cancelled · dedupe lines · standardize names · choose product level · filter period · group by Transaction ID</p></div>'
});
