(window.REVIEWER = window.REVIEWER || { modules: [] }).modules.push({
  id: 'm4', num: 4, title: 'Time Series and Forecasting', short: 'Forecasting',
  blurb: 'Trend and seasonality, moving averages, exponential smoothing, Holt and Holt-Winters.',
  steps: [1, 2, 3, 4, 5, 6, 7],
  pipelineNote: 'Same pipeline, one twist at Step 4: the split must keep time order. Train on the earlier weeks, test on the later ones. Never shuffle.',
  thirty: 'A time series is one variable measured at regular intervals. Find its pattern (level, trend, seasonality), pick a method that handles that pattern, and check it on the most recent periods you held back.',
  analogy: 'Forecasting is like predicting tomorrow’s traffic on your commute: you lean on recent days (smoothing), you know it is getting worse over the years (trend), and Mondays are always bad (seasonality).',
  objectives: ['Explain what a time series is and identify trend, seasonal and cyclical patterns.', 'Define a forecasting problem in business terms.', 'Compute mean, naïve and moving-average forecasts.', 'Compute simple exponential smoothing forecasts and interpret α.', 'Choose between SES, Holt’s trend method and Holt-Winters.', 'Compare forecasts with MAE, MSE, RMSE and MAPE on a time-ordered test period.'],
  lessons: [
    {
      title: 'What a time series is', slides: '5–13',
      simple: 'Numbers recorded in order over time: daily sales, monthly passengers, yearly prices. We use their past pattern to guess the future.',
      body: '<p>A <strong>time series</strong> is a set of observations of one variable taken at regular intervals (hourly, daily, weekly, monthly, yearly). Time series analysis was formalized by <strong>Box and Jenkins (1976)</strong> for data with autocorrelation (values related to their own past).</p>' +
        '<p>The goal is to <strong>uncover a pattern and extrapolate it into the future</strong>, based only on past values of the variable and/or past forecast errors.</p><p>Uses: stock prices, airline fares, labor force size, unemployment, natural gas prices.</p>' +
        '<div class="tablebox"><table><thead><tr><th>Pattern</th><th>What it looks like</th><th>Example</th></tr></thead><tbody><tr><td><strong>Stable level (horizontal)</strong></td><td>Fluctuates around a constant average</td><td>Daily bottled-water sales at a small store</td></tr><tr><td><strong>Trend</strong></td><td>Gradual long-term rise or fall</td><td>Population growth, technology adoption</td></tr><tr><td><strong>Seasonal</strong></td><td>Repeats over a fixed period (can be within a day)</td><td>Pool sales peak every summer; rush-hour traffic</td></tr><tr><td><strong>Cyclical</strong></td><td>Long rises and falls with no fixed period</td><td>Business cycles</td></tr></tbody></table></div>'
    },
    {
      title: 'Defining the problem and preparing the data', slides: '14–16',
      body: '<div class="tablebox"><table><thead><tr><th>Question</th><th>Department store example</th></tr></thead><tbody><tr><td>What will be forecasted?</td><td>Weekly sales revenue</td></tr><tr><td>Time interval?</td><td>One week</td></tr><tr><td>How far ahead?</td><td>Next 1 to 4 weeks</td></tr><tr><td>Who uses it?</td><td>Store manager and staffing team</td></tr><tr><td>What decision?</td><td>Number of temporary sales staff</td></tr><tr><td>How accurate?</td><td>Enough to avoid understaffing or overspending</td></tr></tbody></table></div>' +
        '<p><strong>A forecast should support a specific decision, not simply predict a number.</strong></p>' +
        '<h4>Preparation</h4><ul><li>Chronological order with a consistent interval.</li><li>Check missing periods, missing values, duplicates, incorrect values.</li><li>Investigate extremes from promotions, holidays, emergencies or recording errors.</li><li>Correct date format.</li><li>Keep the most recent observations for testing.</li></ul>' +
        '<p>Then plot the series to see which pattern it has before choosing a method.</p>'
    },
    {
      title: 'Baselines and the time-ordered split', slides: '17–18, 24',
      simple: 'Start with dumb forecasts (the average, or "same as last week") so you know if a fancy method is actually better.',
      body: '<div class="tablebox"><table><thead><tr><th>Baseline</th><th>Rule</th><th>Best for</th></tr></thead><tbody><tr><td><strong>Mean</strong></td><td>Average of all past values</td><td>Stable series, no trend or seasonality</td></tr><tr><td><strong>Naïve</strong></td><td>F(t+1) = y(t), the last actual value</td><td>Simple short-term benchmark</td></tr><tr><td><strong>Seasonal naïve</strong></td><td>Same season last cycle</td><td>Seasonal data</td></tr></tbody></table></div>' +
        '<div class="formula"><span class="eyebrow">Formulas</span><div class="f">Mean: F(t+1) = (y₁ + … + yₜ) ÷ t</div><div class="f">Naïve: F(t+1) = yₜ</div></div>' +
        '<p>Naïve example: this week = $5.8M → next week’s forecast = $5.8M.</p>' +
        '<h4>Training and test periods</h4><p>Use weeks 1–20 to build the model and weeks 21–25 to test it. <strong>Do not randomly shuffle time-series data</strong>: a random split lets information from the future leak into training.</p>'
    },
    {
      title: 'Moving averages', slides: '19–32',
      simple: 'Average the last k values to forecast the next one. Then slide the window forward one period.',
      body: '<div class="formula"><span class="eyebrow">Moving average of order k</span><div class="f">F(t+1) = (yₜ + yₜ₋₁ + … + yₜ₋ₖ₊₁) ÷ k</div><div style="font-size:.9rem">Each new value enters the average and the oldest drops out. Every value in the window gets equal weight.</div></div>' +
        '<div class="example"><span class="eyebrow">Company XZ, 5-year moving average</span><p>Sales ($M) 2003–2012: 4, 6, 5, 8, 9, 5, 4, 3, 7, 8.</p><ul><li>2003–2007: (4+6+5+8+9) ÷ 5 = <b>6.4</b></li><li>2004–2008: (6+5+8+9+5) ÷ 5 = <b>6.6</b></li><li>2005–2009: (5+8+9+5+4) ÷ 5 = <b>6.2</b></li><li>2006–2010: <b>5.8</b> · 2007–2011: <b>5.6</b> · 2008–2012: <b>5.4</b></li></ul></div>' +
        '<div class="example"><span class="eyebrow">Department store, MA(3)</span><p>Weeks 21–25: 5.8, 6.7, 5.2, 6.0, 5.8 ($M).</p><ul><li>Week 24 forecast = (5.2 + 6.7 + 5.8) ÷ 3 = <b>5.9</b>. Actual 6.0 → error e₂₄ = 6.0 − 5.9 = <b>0.1</b>.</li><li>Week 26 forecast = (5.8 + 6.0 + 5.2) ÷ 3 = <b>5.67 ≈ 5.7</b>.</li></ul></div>' +
        '<h4>Choosing k</h4><ul><li><strong>Small k</strong>: reacts quickly; best when the level shifts suddenly.</li><li><strong>Large k</strong>: smoother, reacts slowly; best with wide, infrequent fluctuations.</li><li>MA(4) on quarterly data, MA(12) on monthly data <strong>averages out the seasonal effect</strong>.</li><li>Moving averages don’t handle trend or seasonality well, though they beat the overall mean.</li></ul>' +
        '<div class="tablebox"><table><thead><tr><th>Type</th><th>Weights</th><th>Use when</th></tr></thead><tbody><tr><td><strong>SMA</strong></td><td>Equal</td><td>Stable data, quick smooth view</td></tr><tr><td><strong>WMA</strong></td><td>Chosen weights, usually more on recent</td><td>Recent data matter more</td></tr><tr><td><strong>EMA</strong></td><td>Exponentially decaying</td><td>Volatile data; fast reaction (finance)</td></tr></tbody></table></div>',
      exam: 'WMA example: weights 0.5, 0.3, 0.2 on the last three weeks (6.0, 5.2, 6.7): 0.5·6.0 + 0.3·5.2 + 0.2·6.7 = 3.0 + 1.56 + 1.34 = 5.90. The weights must add to 1.',
      code: [{ t: 'Moving averages in pandas (slides 50–54)', c: 'ts = data["Passengers"]\nsma = ts.rolling(window=12).mean()\nweights = np.arange(1, 13)\nwma = ts.rolling(12).apply(lambda x: np.dot(x, weights) / weights.sum(), raw=True)\nema = ts.ewm(span=12, adjust=False).mean()' }]
    },
    {
      title: 'Simple exponential smoothing', slides: '33–35',
      simple: 'New forecast = a bit of the latest actual + the rest from the old forecast. α decides how big "a bit" is.',
      body: '<div class="formula"><span class="eyebrow">SES</span><div class="f">F(t+1) = α·yₜ + (1 − α)·Fₜ</div><div style="font-size:.9rem">0 ≤ α ≤ 1. Equivalent form: F(t+1) = Fₜ + α(yₜ − Fₜ), so the forecast moves a fraction α of the last error.</div></div>' +
        '<div class="tablebox"><table><thead><tr><th>α</th><th>Effect</th></tr></thead><tbody><tr><td>Close to 0</td><td>Changes slowly; heavy weight on the past</td></tr><tr><td>Close to 1</td><td>Responds quickly to recent changes</td></tr></tbody></table></div>' +
        '<div class="example"><span class="eyebrow">Department store (slide 35)</span><p>Actual week 24 = 6.0, forecast week 24 = 5.9, α = 0.30.</p><p>F₂₅ = 0.30 × 6.0 + 0.70 × 5.9 = 1.80 + 4.13 = <b>$5.93M</b>.</p></div>' +
        '<p>SES handles <strong>level only</strong>. With a trend it lags behind; with seasonality it smooths the peaks away.</p>'
    },
    {
      title: 'Holt’s trend method', slides: '36–39',
      body: '<p>Extends SES by estimating both the <strong>level</strong> and the <strong>trend</strong>. Use it when values rise or fall steadily but there is no meaningful seasonal pattern.</p>' +
        '<div class="formula"><span class="eyebrow">Holt (two constants: α level, β trend)</span><div class="f">Lₜ = α·yₜ + (1 − α)(Lₜ₋₁ + Tₜ₋₁)</div><div class="f">Tₜ = β(Lₜ − Lₜ₋₁) + (1 − β)·Tₜ₋₁</div><div class="f">F(t+h) = Lₜ + h·Tₜ</div></div>' +
        '<div class="example"><span class="eyebrow">Monthly sales (slide 38)</span><p>Level in May = 120 units, trend = 8 units/month, h = 1 → June forecast = 120 + 1 × 8 = <b>128 units</b>. Two months ahead (July): 120 + 2 × 8 = 136.</p></div>'
    },
    {
      title: 'Holt-Winters seasonal method', slides: '40–44',
      simple: 'Holt plus a seasonal multiplier: a normal December forecast of 500 × a December factor of 1.30 = 650.',
      body: '<p>Adds a <strong>seasonal component</strong> to Holt. Use it when the series has a level, a trend and a repeating seasonal pattern at regular intervals (airline passengers, quarterly tourism, December retail peaks).</p>' +
        '<div class="formula"><span class="eyebrow">Three constants: α level · β trend · γ seasonality</span><div class="f">F(t+h) = (Lₜ + h·Tₜ) × S(t+h−m)</div><div style="font-size:.9rem">m = length of the seasonal cycle: monthly data with yearly seasons m = 12, quarterly m = 4, weekly m = 52.</div></div>' +
        '<div class="example"><span class="eyebrow">December (slide 43)</span><p>Normal forecast for December = 500 units; December seasonal factor = 1.30 → 500 × 1.30 = <b>650 units</b>, because December sales are typically 30% above normal.</p></div>' +
        '<div class="tablebox"><table><thead><tr><th>Model</th><th>Handles</th><th>Example</th></tr></thead><tbody><tr><td>Simple exponential smoothing</td><td>Level</td><td>Stable weekly demand</td></tr><tr><td>Holt’s trend method</td><td>Level + trend</td><td>Sales rising every month</td></tr><tr><td>Holt-Winters</td><td>Level + trend + seasonality</td><td>Airline passengers, holiday retail</td></tr></tbody></table></div>',
      exam: 'This is the <em>multiplicative</em> form (seasonal factor multiplies). The additive form adds a seasonal amount instead: F = L + hT + S. Use multiplicative when seasonal swings grow with the level.'
    },
    {
      title: 'Choosing parameters and measuring accuracy', slides: '45–49',
      body: '<p>Each model has settings: k for moving averages, weights for WMA, α for SES, α/β/γ for Holt-Winters. Test several reasonable values on the training data (e.g., MA(3), MA(4), MA(5)) and pick the one with the <strong>lowest test-period error</strong> and no pattern in its residuals.</p>' +
        '<div class="formula"><span class="eyebrow">Forecast error eₜ = yₜ − Fₜ</span><div class="f">MAE = Σ|eₜ| ÷ n</div><div class="f">MSE = Σeₜ² ÷ n &nbsp;·&nbsp; RMSE = √MSE</div><div class="f">MAPE = (Σ|eₜ ÷ yₜ| ÷ n) × 100%</div><div style="font-size:.9rem">Lower is better for all. Avoid MAPE when actual values can be zero or near zero.</div></div>' +
        '<div class="tablebox"><table><thead><tr><th>Model (test)</th><th>MAE</th><th>RMSE</th><th>MAPE</th><th>Decision</th></tr></thead><tbody><tr><td>Naïve</td><td>0.62</td><td>0.76</td><td>10.8%</td><td>Baseline</td></tr><tr><td>MA(3)</td><td>0.48</td><td>0.61</td><td>8.2%</td><td>Better than baseline</td></tr><tr><td>Exponential smoothing</td><td>0.44</td><td>0.56</td><td>7.6%</td><td>Best accuracy</td></tr></tbody></table></div>' +
        '<p>Good residuals fluctuate randomly around zero, show no trend, no repeating seasonal pattern, steady variability, and few extreme errors. A pattern means the model missed information.</p>' +
        '<h4>Uncertainty</h4><p>A forecast is an estimate, not a guarantee. Report a <strong>point forecast</strong> ($5.9M) with a <strong>prediction interval</strong> ($5.2M–$6.6M). A wide interval might mean hiring flexible on-call staff instead of fixed temporaries.</p>'
    }
  ],
  traps: [
    { errata: true, slide: 'slide 23', title: '“Continue until 2009–2013”', text: 'The Company XZ data stop at 2012, so the last 5-year window is <strong>2008–2012</strong> (average 5.4). There is no 2013 value to use.' },
    { errata: true, slide: 'slide 20', title: 'Moving average formula divides by n', text: 'The slide writes (n₁ + n₂ + … + nₓ) ÷ n. Clearer: add the <strong>k most recent values</strong> and divide by <strong>k</strong>, the number of terms in the window.' },
    { title: 'Never shuffle time-series data', text: 'Train on earlier periods, test on later ones. A random split leaks future information into training and makes the model look better than it is.' },
    { title: 'Small k vs large k', text: 'Small k reacts fast (sudden level shifts). Large k smooths more (wide, infrequent fluctuations). MA(12) on monthly data removes yearly seasonality.' },
    { title: 'α near 1 vs near 0', text: 'α near 1 = follows the latest value closely (responsive). α near 0 = barely moves (stable, smooth). Don’t flip these.' },
    { title: 'Match the method to the pattern', text: 'Level only → SES. Level + trend → Holt (α, β). Level + trend + seasonality → Holt-Winters (α, β, γ). One extra Greek letter per pattern.' },
    { title: 'MAPE breaks near zero', text: 'MAPE divides by the actual value. With zero or tiny actuals it explodes or is undefined; use MAE or RMSE.' }
  ],
  quiz: [
    { type: 'mcq', topic: 'Patterns', q: 'Pool sales are low every fall and winter and peak every spring and summer. This is a…', options: ['Trend pattern', 'Seasonal pattern', 'Cyclical pattern', 'Stable level'], answer: 1, why: ['A trend is a long-term rise or fall.', 'Correct: it repeats at a fixed yearly interval.', 'Cycles have no fixed period.', 'The values clearly move with the seasons.'] },
    { type: 'num', topic: 'Moving average', q: 'Weeks 21–23 sales are 5.8, 6.7, 5.2 ($M). What is the MA(3) forecast for week 24? (one decimal)', answer: 5.9, tol: 0.01, explain: '(5.8 + 6.7 + 5.2) ÷ 3 = 17.7 ÷ 3 = 5.9.' },
    { type: 'num', topic: 'Moving average', q: 'Actual week-24 sales were 6.0 against a forecast of 5.9. What is the forecast error?', answer: 0.1, tol: 0.001, explain: 'e = actual − forecast = 6.0 − 5.9 = 0.1.' },
    { type: 'num', topic: 'Moving average', q: 'Company XZ sales 2003–2007 are 4, 6, 5, 8, 9 ($M). What is the 5-year moving average?', answer: 6.4, tol: 0.001, explain: '32 ÷ 5 = 6.4.' },
    { type: 'num', topic: 'Exponential smoothing', q: 'α = 0.30, actual y₂₄ = 6.0, forecast F₂₄ = 5.9. Compute F₂₅ (two decimals).', answer: 5.93, tol: 0.005, explain: '0.30 × 6.0 + 0.70 × 5.9 = 1.80 + 4.13 = 5.93.' },
    { type: 'mcq', topic: 'Exponential smoothing', q: 'You want a forecast that reacts quickly to recent changes. Choose α…', options: ['Close to 0', 'Close to 1', 'Exactly 0.5', 'α does not affect responsiveness'], answer: 1, why: ['Near 0 gives most weight to the past.', 'Correct: near 1 follows the latest actual closely.', '0.5 is a middle ground, not the most responsive.', 'α is exactly the responsiveness setting.'] },
    { type: 'num', topic: 'Holt', q: 'Holt’s method: level = 120 units, trend = 8 units/month. Forecast 2 months ahead.', answer: 136, tol: 0, explain: 'F = L + h·T = 120 + 2 × 8 = 136.' },
    { type: 'num', topic: 'Holt-Winters', q: 'Normal December forecast = 500 units and the December seasonal factor = 1.30. Holt-Winters forecast?', answer: 650, tol: 0, explain: '500 × 1.30 = 650.' },
    { type: 'mcq', topic: 'Choosing a method', q: 'Monthly airline passengers grow every year and peak every summer. Best method?', options: ['Simple exponential smoothing', 'Holt’s trend method', 'Holt-Winters', 'Overall mean'], answer: 2, why: ['SES handles level only.', 'Holt handles trend but not seasonality.', 'Correct: level, trend and seasonality.', 'The mean ignores both trend and seasonality.'] },
    { type: 'mcq', topic: 'Choosing a method', q: 'How many smoothing constants does Holt’s trend method use?', options: ['One (α)', 'Two (α, β)', 'Three (α, β, γ)', 'None'], answer: 1, why: ['That is SES.', 'Correct: α for level, β for trend.', 'That is Holt-Winters.', 'All exponential smoothing methods have at least α.'] },
    { type: 'mcq', topic: 'Choosing a method', q: 'For weekly data with yearly seasonality, the seasonal period m is…', options: ['4', '12', '52', '7'], answer: 2, why: ['4 is for quarterly data.', '12 is for monthly data.', 'Correct: 52 weeks in a year.', '7 would be a weekly cycle in daily data.'] },
    { type: 'mcq', topic: 'Split', q: 'Why not randomly split a weekly sales series into train and test sets?', options: ['It makes the model too simple', 'Future information leaks into training', 'Random splits are slower', 'Test sets must always be 50%'], answer: 1, why: ['The split doesn’t change model complexity.', 'Correct: the model would learn from weeks after the ones it is tested on.', 'Speed is not the issue.', 'There is no such rule.'] },
    { type: 'mcq', topic: 'Accuracy', q: 'Daily sales of a rare item are often 0. Which error measure should you avoid?', options: ['MAE', 'RMSE', 'MAPE', 'MSE'], answer: 2, why: ['MAE works fine with zeros.', 'RMSE works fine with zeros.', 'Correct: MAPE divides by the actual value.', 'MSE works fine with zeros.'] },
    { type: 'mcq', topic: 'Moving average', q: 'Quarterly data show a seasonal pattern you want to smooth away. Use…', options: ['MA(2)', 'MA(4)', 'MA(12)', 'Naïve forecast'], answer: 1, why: ['Two quarters don’t cover the full cycle.', 'Correct: four quarters average out the yearly season.', 'MA(12) is for monthly data.', 'The naïve forecast keeps the seasonality.'] },
    { type: 'tf', topic: 'Uncertainty', q: 'A point forecast of $5.9M guarantees next week’s sales will be close to $5.9M.', answer: 1, explain: 'False. A forecast is an estimate. Pair it with a prediction interval (e.g., $5.2M–$6.6M).' }
  ],
  cards: [
    ['Four time-series patterns?', 'Stable level, trend, seasonality, cyclical.', 'Plus outliers to investigate.'],
    ['Naïve forecast rule?', 'Next value = the last actual value.', ''],
    ['MA(k) formula?', 'Average of the k most recent values.', ''],
    ['Effect of a small k?', 'Reacts quickly; good for sudden level shifts.', ''],
    ['SES formula?', 'F(t+1) = α·yₜ + (1 − α)·Fₜ', ''],
    ['α close to 1 means?', 'The forecast responds quickly to recent changes.', ''],
    ['Holt forecast formula?', 'F(t+h) = Lₜ + h·Tₜ', 'Two constants: α (level), β (trend).'],
    ['Holt-Winters adds…?', 'A seasonal component with constant γ.', 'Multiplicative: (L + hT) × S.'],
    ['Seasonal period m for monthly data?', '12', 'Quarterly 4, weekly 52.'],
    ['When to avoid MAPE?', 'When actual values can be zero or near zero.', ''],
    ['How to split time series?', 'By time: earlier periods for training, latest for testing. Never shuffle.', '']
  ],
  cheat: '<div class="card stack"><h3>Patterns → method</h3><p>Stable → mean / SES<br>Trend → Holt (α, β)<br>Trend + season → Holt-Winters (α, β, γ)<br>Cycle → trend + business analysis<br>Outliers → investigate first</p></div>' +
    '<div class="card stack"><h3>Baselines</h3><p>Mean · Naïve F = yₜ · Seasonal naïve (same season last cycle)</p></div>' +
    '<div class="card stack"><h3>Moving average</h3><p>F(t+1) = average of last k values<br>Small k fast · large k smooth<br>MA(4) quarterly, MA(12) monthly removes seasonality<br>SMA equal · WMA chosen weights · EMA exponential</p></div>' +
    '<div class="card stack"><h3>Exponential smoothing</h3><p>SES: F(t+1) = αyₜ + (1−α)Fₜ<br>Holt: F = L + hT<br>HW: F = (L + hT) × S<br>m: 12 monthly, 4 quarterly, 52 weekly</p></div>' +
    '<div class="card stack"><h3>Accuracy</h3><p>e = y − F<br>MAE = mean |e| · MSE = mean e² · RMSE = √MSE<br>MAPE = mean |e/y| × 100 (avoid near 0)</p></div>' +
    '<div class="card stack"><h3>Worked numbers</h3><p>MA(3) wk24 = 5.9, error 0.1 · wk26 = 5.7<br>SES wk25 = 5.93 · Holt June = 128 · HW Dec = 650</p></div>'
});
