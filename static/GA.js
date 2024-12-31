var form;
var tbody;
var grades;

var times;
var weights;
var grade_spreads;
var grades;
var allgrades;
var currentDistributions;
var val_sums;

var currentCategories;
var goals;

var combinedx;
var combinedy;

async function main(){
  startLoading();
  // get all the data
  const sheets = await fetchRequest('/data', { data: 'Classes, Goals, Distributions, Grades' });
  // if no grades(len grades < 2, show error)
  if(sheets['Grades'].length < 2){
    const errorMessage = document.getElementById("error");
    errorMessage.textContent = "No grades found";
    // hide loading wheel
    endLoading();
    // stop any further execution
    window.stop();
    return;
  }
  const data = await fetchRequest('/GAsetup', sheets);

    if(data['error']){
      const errorMessage = document.getElementById("error");
      errorMessage.textContent = data['error'];
      // hide loading wheel
      endLoading();
      // stop any further execution
      window.stop();
      return;
    }
    console.log(data)
    // data includes Weights, times, grade_spreads, grades, categories, stats, compliments
    weights = data["Weights"];
    times = data["times"];
    grade_spreads = data["grade_spreads"];
    grades = data["grades"];
    allgrades = grades;
    currentDistributions = data["distributions"];
    console.log(currentDistributions)
    categories = data["categories"];
    stats = data["stats"];
    compliments = data["compliments"];
    val_sums = data["cat_value_sums"];
    goals = data["goals"];

    setClasses(weights)
    setStats(stats)
    
    setCompliments(compliments)
    
    draw_graphs(grade_spreads, times, weights, grades, ['All', 'all'], val_sums, 5, goals);
    setGoalTable(goals)
    displayGrades(allgrades);

    // Initialize modal after data is loaded
    initializeGoalModal();
    endLoading();
}

function setStats(stats){
  console.log(stats)
  // set p tags to stats
  document.getElementById("s1").textContent = stats["gpa"] + "%"
  document.getElementById("s2").textContent = stats["raw_avg"] + "%"
  document.getElementById("s3").textContent = stats["avg_change"] + "%"
  document.getElementById("s4").textContent = stats["most_improved_class"]
  // get the next sibling of the p tag and set the text content to stats[grade_changes][class_name]
  document.getElementById("s4").nextElementSibling.textContent += "(+"+stats["grade_changes"][stats["most_improved_class"]]+"%)"
  document.getElementById("s5").textContent = stats["most_worsened_class"]
  document.getElementById("s5").nextElementSibling.textContent += "("+stats["grade_changes"][stats["most_worsened_class"]]+"%)"
  document.getElementById("s6").textContent = stats["past30_avg"] + "%"
}
function setClasses(weights){
    var classes = Object.keys(weights)
    var class_div = document.getElementById("classes")
    console.log(classes)
    var all_checkboxes = [];

    //create an all checkbox that checks all the checkboxes in the class and their subcategories
    let [t, cb, m] = createCheckbox("All");
    t.appendChild(m);
    t.appendChild(cb);
    class_div.appendChild(t);
      
      for(let x=0;x<classes.length;x++){
      // define the class checkboxes
      let subcategories = document.createElement("div");
      let [text, checkbox, checkmark] = createCheckbox(classes[x])
      all_checkboxes.push(checkbox);

      // for each category in the class, create a checkbox
      for (const category in weights[classes[x]]) {
        let label = document.createElement("label");
        let input = document.createElement("input");
        all_checkboxes.push(input);
        input.type = 'checkbox';
        input.value = category.toLowerCase();
        input.name = 'class';
        label.textContent = "     "+ category;
        label.className = 'category-checkbox';
        input.addEventListener('change', function() {
          if(this.checked) {
            label.style.backgroundColor = 'rgba(228, 76, 101, 1)'; // Directly change the background color
          } else {
            label.style.backgroundColor = '#1b1c1c'; // Revert to original color
          }
        });
        label.appendChild(input);
        subcategories.appendChild(label);
      }

      // hide subcategories by default
      subcategories.style.display = 'none';

      checkbox.addEventListener('change', function() {
        checkboxes = subcategories.querySelectorAll('input[name="class"]');
        if(this.checked) {
          text.style.backgroundColor = 'rgba(228, 76, 101, 1)'; // Directly change the background color
          subcategories.style.display = 'block';
          // check all subcategories
          for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = true;
            checkboxes[i].dispatchEvent(new Event('change'));
          }
        } else {
          text.style.backgroundColor = '#1b1c1c'; // Revert to original color
          subcategories.style.display = 'none';
          // uncheck all subcategories
          for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false;
            checkboxes[i].dispatchEvent(new Event('change'));
          }
        }
      });
      text.appendChild(checkmark);
      text.appendChild(checkbox);
      class_div.appendChild(text);
      class_div.appendChild(subcategories);
    }


    //set all checkbox properties
    
    cb.addEventListener('change', function() {
      if(this.checked) {
        t.style.backgroundColor = 'rgba(228, 76, 101, 1)'; // Directly change the background color
        for (let i = 0; i < all_checkboxes.length; i++) {
          all_checkboxes[i].checked = true;
          console.log(all_checkboxes[i], "checked")
          all_checkboxes[i].dispatchEvent(new Event('change'));
        }
      } else {
        t.style.backgroundColor = '#1b1c1c'; // Revert to original color
        for (let i = 0; i < all_checkboxes.length; i++) {
          all_checkboxes[i].checked = false;
          all_checkboxes[i].dispatchEvent(new Event('change'));
        }
      }
    });


}

function createCheckbox(content){
  let text = document.createElement("label");
  let checkbox = document.createElement("input");
  let checkmark = document.createElement("span");
  

  checkbox.type = 'checkbox';
  checkbox.value = content.toLowerCase();
  checkbox.name = 'class';

  text.textContent = "     "+ content;
  text.className = 'class-checkbox';

  checkmark.className = 'checkmark';
  return [text, checkbox, checkmark];
}

async function setGoalProgress(){
    const progress_data = await fetchRequest('/goals_progress', { data: '' });
    
    console.log(progress_data)
    container_element = document.getElementById("GoalProgressContainer")
    for (let i = 0; i < progress_data.length; i++) {
      const goal = progress_data[i];
      const goalElement = document.createElement("div");
      goalElement.className = "goal";
      var dateBar = document.createElement('progress');
      var gradeBar = document.createElement('progress');
      var br = document.createElement('br');
      
      dateBar.value = parseFloat(goal.percent_time_passed);
      dateBar.max = 1;
      
      gradeBar.value = parseFloat(goal.percent_grade_change);
      gradeBar.max = 1;
  
      // code to round to 1 decimal place: Math.round(num * 10) / 10
  
      var title = document.createElement('h3');
      title.textContent = "Your goal for "+goal.class+" "+goal.category;
      var datesText = document.createElement('p');
      datesText.textContent = "Date set: " + goal.date_set+" | Target date: " + goal.goal_date;
  
      var gradesText = document.createElement('p');
      gradesText.textContent = "Grade when set: " + Math.round(goal.grade_when_set*100)/100+" | Target grade: " + goal.goal_grade;
  
      var trajectory = document.createElement('p');
      trajectory.textContent = "Current Trajectory by goal date: " + Math.round(goal.current_grade_trajectory*100)/100;
  
      goalElement.appendChild(title);
      goalElement.appendChild(datesText);
      goalElement.appendChild(dateBar);
      goalElement.appendChild(br);
      goalElement.appendChild(gradesText);
      goalElement.appendChild(gradeBar);
      goalElement.appendChild(trajectory);
      container_element.appendChild(goalElement);
    }    
}

main()

// gotc = grades over time chart
function draw_gotc(grade_spreads, times, weights, grades, cat, val_sums, comp_time, goals){
// define the canvas
const canvas = document.querySelector('#myGraph');


// Convert dates from ordinal(eg. 79432) to strings(eg. 12/31/2021)
let dateStrings = [];
for (let i = 0; i < times.length; i++) {
  dateStrings.push(serialToDate(times[i]));
}

// Filter grades for cla(class) and cat(category) into grade_points
let grade_points = [];
for (let i = 0; i < grades.length; i++) {
  let grade = grades[i];
  console.log(cat.includes('all') && cat.includes('All'))
  
  if ((cat.includes(grade['class'].toLowerCase()) || cat.includes('all')) && 
      (cat.includes(grade['category'].toLowerCase()) || cat.includes('All'))) {
    grade_points.push(grade);
  }
}
console.log(grade_points)

// Filter grade_spreads for cla(class) and cat(category) grade_spreads
let spreads = [];
let spread_names = [];
let w = [];
for (const spread_class in grade_spreads) {
  for (const spread_category in grade_spreads[spread_class]) {
    let spread = grade_spreads[spread_class][spread_category];
    // if cla includes spread['class'] or all AND cat includes spread['category'] or all, add spread to spreads
    if ((cat.includes(spread_class.toLowerCase()) || cat.includes('all')) && 
        (cat.includes(spread_category.toLowerCase()) || cat.includes('All'))) {
      spreads.push(spread);
      spread_names.push(spread_category + " " + spread_class); // Switch order to "category class"
      w.push(weights[spread_class][spread_category]);
    }
  }
}


// Graph all the spreads as lines over times
let spreadTraces = [];
for (let i = 0; i < spreads.length; i++) {
  // generate random color
  let randomColor = Math.floor(Math.random()*16777215).toString(16);
  let spread = spreads[i];
  // correct 99.993 to 100
  spread = spread.map(value => value === 99.993 ? 100 : value);
  let trace = {
    x: times,
    y: spread,
    mode: 'lines',
    line: {
      color: randomColor,
      width: 1
    },
    name: spread_names[i],
    hovertemplate: `${spread_names[i]}<br>Date: %{x}<br>Grade: %{y}<extra></extra>`, // Custom hover template
    text: spread_names[i] // Use text for the full label
  };
  spreadTraces.push(trace);
}

// Add a scatter plot for individual grades
grade_points_dates = grade_points.map(point => point['date']);
grade_point_sizes = grade_points.map(point => {
  score = point['score'];
  value = point['value'];
  category = point['category'].toLowerCase();
  class_name = point['class'].toLowerCase();
  cat_weight = weights[class_name][category];
  try{
  cat_grade = grade_spreads[class_name][category].slice(-1)[0];
  }
  catch{
    console.error("No grade spread for class: "+class_name+" and category: "+category)
  }
  cat_val_sum = val_sums[class_name][category];
  return (value/cat_val_sum)*cat_weight;
});

const scatterPlotTrace = {
  // Get all the x coordinates from grade_points
  x: grade_points_dates,
  // convert point['date'] to ordinal date
  y: grade_points.map(point => point['score']/point['value']*100),
  mode: 'markers', // This makes it a scatter plot
  type: 'scatter', // Explicitly stating the plot type is optional but can be helpful
  marker: {
    color: 'rgba(255, 127, 14, 0.5)', // Example color
    size: grade_points.map(point => point['value']/5) // This sets the size of the markers
  },
  text: grade_points.map(point => point['name']), // An array of strings for hover text, one for each point
  hovertemplate: grade_points.map(point => `
    Name: ${point.name}<br>
    Class: ${point.class}<br>
    Category: ${point.category}<br>
    Grade: ${(point.score / point.value * 100).toFixed(2)}%<br>
    Date: ${serialToDate(point.date)}<br>
    GPA Impact: ${point['GPA_impact'].toFixed(2)}<br>
    Class Impact: ${point['class_impact'].toFixed(2)}<br>
    Category Impact: ${point['cat_impact'].toFixed(2)}<br>
    <extra></extra>
  `),
  hoverinfo: 'text', // Specify to show only the custom text on hover
  name: 'Individual Grades(click to show)',
  visible: 'legendonly',
  hoverlabel: {
    bgcolor: '#636261', // Set the background color of the hover box to gray
    bordercolor: '#e44c65', // Match border color to background for rounded effect
    font: {
        color: 'white', // Set the font color to white for better contrast
        size: 14, // Increase font size for larger text
    },
    align: 'left' // Align text to the left
}
};
spreadTraces.unshift(scatterPlotTrace)


// Determine the furthest goal date
let goalDates = goals && goals.length > 0 ? goals.map(goal => goal.date) : [];
let maxGoalDate = goalDates.length > 0 ? Math.max(...goalDates) : -Infinity;

// Combine times and grade_point_dates
let all_dates = times.concat(grade_points_dates, goalDates);
// Find min and max of all_dates
let min_x = Math.min(...all_dates);
let max_x = goalDates.length > 0 ? Math.max(maxGoalDate, Math.max(...all_dates)) : Math.max(...all_dates);

console.log(min_x, max_x);

// Define the layout
const layout = {
    title: "Grades Over Time",
    xaxis: {
        title: 'Date',
        tickvals: times,
        ticktext: dateStrings,
        range: [min_x - 3, max_x + 3], // Extend range to include furthest goal
        showgrid: false
    },
    yaxis: {
        title: 'Grades',
        showgrid: false
    },
    showlegend: false,
    displayModeBar: false,
    paper_bgcolor: 'rgba(0,0,0,0)', // Transparent background
    plot_bgcolor: 'rgba(0,0,0,0)',  // Transparent plot area
    font: {
        color: 'white' // White text
    },
    hovermode: 'closest' // Show hover info only for the closest point
};

// create final, combined line: at each timepoint, sum the weighted grade_spreads
let final = [];
for (let i = 0; i < times.length; i++) {
  let gradesum = 0;
  let weightsum = 0;
  for (let j = 0; j < spreads.length; j++) {
    // Check if the category value is exactly 99.993
    if (spreads[j][i] !== 99.993) {
      gradesum += spreads[j][i] * w[j];
      weightsum += w[j];
    }
  }
  // Only calculate the sum if weightsum is greater than 0 to avoid division by zero
  let sum = weightsum > 0 ? gradesum / weightsum : 100;
  final.push(sum);
}
console.log(final)

combinedx = times;
combinedy = final;

// create an array with a copy of dict {y: final} for each spread
let finalTraces = [];
let numTraces = [];
for (let i = 0; i < spreads.length; i++) {
  finalTraces.push({
    y: final,
    hovertemplate: 'Combined<br>Date: %{x}<br>Grade: %{y:.1f}%<extra></extra>'
  });
  numTraces.push(i+1);
}

// Render the graph
Plotly.newPlot('myGraph', spreadTraces, layout);

// update goals
updateGoals(goals, cat);

// when checkbox with id 'individual' is clicked, show or hide the scatter plot
document.getElementById('individual').addEventListener('change', function() {
  if(this.checked) {
    spreadTraces[0].visible = true;
  } else {
    spreadTraces[0].visible = 'legendonly';
  }
  Plotly.react('myGraph', spreadTraces, layout);
});
// hide loading wheel
document.getElementById('loadingWheel').style.visibility = "hidden";
setTimeout(function(){
  console.log(comp_time)
  // Start animation
  animationGOTC(numTraces, finalTraces, "combine");
  console.log(finalTraces)
  // when checkbox with id 'components' is clicked, split or combine the line components
  document.getElementById('components').addEventListener('change', function() {
    if(this.checked) {
      // Split the lines when checked
      let componentTraces = spreads.map((spread, index) => {
        return {
          y: spread,
          hovertemplate: `${spread_names[index]}<br>Date: %{x}<br>Grade: %{y:.1f}%<extra>${spread_names[index]}</extra>`
        };
      });
      animationGOTC(numTraces, componentTraces);
    } else {
      // Combine the lines when unchecked
      animationGOTC(numTraces, finalTraces);
    }
  });

  // Add event listener for the new "Class components" checkbox
  document.getElementById('classComponents').addEventListener('change', function() {
    if (this.checked) {
      // Calculate and display class components
      let classTraces = calculateClassComponents(spreads, weights, spread_names, w);
      // Add proper hover templates to class traces
      classTraces = classTraces.map(trace => ({
        ...trace,
        hovertemplate: `${trace.name}<br>Date: %{x}<br>Grade: %{y:.1f}%<extra>${trace.name}</extra>`
      }));
      animationGOTC(numTraces, classTraces);
    } else {
      // Combine the lines when unchecked
      animationGOTC(numTraces, finalTraces);
    }
  });
}, comp_time*500);
}

async function animationGOTC(numTraces, traces){
  const animationDuration = 3500; // 3.5 seconds for animation

  await Plotly.animate('myGraph', {
    data: traces,
    traces: numTraces,
    layout: {}
  }, {
    transition: {
      duration: animationDuration,
      easing: 'cubic-in-out'
    },
    frame: {
      duration: animationDuration,
      redraw: true  // Force complete redraw
    }
  });

  // Wait for animation to complete before resizing
  await new Promise(resolve => setTimeout(resolve, animationDuration));
  
  // Store current goals and images
  const currentLayout = document.getElementById('myGraph').layout;
  const currentGoals = currentLayout.images || [];
  
  // Perform relayout with preserved goals
  await Plotly.relayout('myGraph', {
    'yaxis.autorange': true,
    images: currentGoals
  });
}


// Add event listener to button addGoal to set a general click event to add a goal
document.getElementById('addGoal').addEventListener('click', function() {
    console.log('addGoal clicked');
    var myPlot = document.getElementById('myGraph');

    function clickHandler(event) {
        console.log("adding goal", myPlot.layout);
        var xaxis = myPlot.layout.xaxis;
        var yaxis = myPlot.layout.yaxis;
        var clickx = event.clientX;
        var clicky = event.clientY;
        var left = myPlot.getBoundingClientRect().left;
        var top = myPlot.getBoundingClientRect().top;
        var minx = xaxis.range[0];
        var maxx = xaxis.range[1];
        var miny = yaxis.range[0];
        var maxy = yaxis.range[1];

        // Calculate the relative position of the click
        var relX = (clickx - left) / myPlot.clientWidth;
        var relY = (clicky - top) / myPlot.clientHeight;

        // Convert relative position to data coordinates
        var x = minx + relX * (maxx - minx);
        var y = miny + (1 - relY) * (maxy - miny);

        console.log(`Click at data coordinates: (${x}, ${y})`);
        addGoal(x, y);

        // Remove the click event listener after it runs
        myPlot.removeEventListener('click', clickHandler);
        console.log('click event listener removed');

        // reset the x axis range to go from currentRange[0] to currentRange[1] or x, whichever is greater
        let newRange = [currentRange[0], Math.min(x, currentRange[1])];
        Plotly.relayout(myPlot, {
            'xaxis.range': newRange
        });
    }

    // Compress the graph on the horizontal axis and add new date values
    var currentRange = myPlot.layout.xaxis.range;
    var newEndDate = currentRange[1] + 60;
    var tickvals = myPlot.layout.xaxis.tickvals;
    var ticktext = myPlot.layout.xaxis.ticktext;
    var interval = tickvals[1] - tickvals[0];
    while (tickvals[tickvals.length - 1] < newEndDate) {
        var newTick = tickvals[tickvals.length - 1] + interval;
        tickvals.push(newTick);
        var date = serialToDate(newTick);
        ticktext.push(date);
    }

    // Set xaxis range to currentRange[0] to newEndDate
    Plotly.relayout(myPlot, {
        'xaxis.range': [currentRange[0], newEndDate]
    });

    // Attach the general click handler
    myPlot.addEventListener('click', clickHandler);
    console.log('click event listener added', myPlot);
});


// log the goal to the database and update goals
async function addGoal(xData, yData) {
  
  // convert xData(serial date) to string date
  let dateString = serialToDate(xData);
  // set dateSet to today's date
  let dateSet = new Date();
  let dateSetString = (dateSet.getMonth() + 1) + '/' + dateSet.getDate() + '/' + (dateSet.getFullYear());
  // generate a random 5 digit id
  let id = Math.floor(Math.random() * 90000) + 10000;
  let data = {date: dateString, grade: yData, categories: currentCategories, date_set: dateSetString, OSIS: osis, id: id}
  await fetchRequest('/post_data', {sheet: "Goals", data: data});
  goals.push(data)
  console.log(goals, data)
  // update goals
  updateGoals(goals, currentCategories);
  // update goalTable
  setGoalTable(goals);
}

function updateGoals(goals, categories) {
  // if goals does not exist, return
  if (!goals) {
    return;
  }
  // for each goal in goals where goal['categories'] matches categories, add a line on the graph
  graph = document.getElementById('myGraph');
  medals = [];
  lines = [];
  for (let i = 0; i < goals.length; i++) {
    let goal = goals[i];
    console.log(goal['categories'], categories)
    if (goal['categories'].every(category => categories.includes(category))) {
      // convert goal['date'] to serial date
      let xgoal = dateToSerial(goal['date']);
      let ygoal = goal['grade'];
      let xinitdate = goal['date_set'];
      let xinit = dateToSerial(xinitdate);
      // get yinit by interpolating from combinedx and combinedy
      let yinit = interpolate(xinit, combinedx, combinedy);

      console.log("in updateGoals", xgoal, ygoal, xinit, yinit);
      // create a line from (xinit, yinit) to (xgoal, ygoal) on the graph
      let line = {
        x: [xinit, xgoal],
        y: [yinit, ygoal],
        mode: 'lines',
        line: {
          color: 'rgba(255, 255, 255, 0.5)',
          width: 1
        },
        name: 'Goal'
      };
      lines.push(line);
      // add the image(/static/media/GoalMedal.png) of a medal, representing the goal, at (xgoal, ygoal)
      sizex = (graph.layout.xaxis.range[1]-graph.layout.xaxis.range[0])/5;
      sizey = (graph.layout.yaxis.range[1]-graph.layout.yaxis.range[0])/5;
      
      let image = {
        source: '/static/media/GoalMedal.png',
        x: xgoal,
        y: ygoal,
        xref: 'x',
        yref: 'y',
        sizinf: 'contain',
        sizex: 5,
        sizey: 5,
        xanchor: 'center',
        yanchor: 'middle'
      };
      medals.push(image);
    }
  }
  console.log(medals)
  Plotly.addTraces(graph, lines);
  Plotly.relayout(graph, {
    images: medals,
    'images[0].xref': 'paper',
    'images[0].yref': 'paper',
    'images[0].sizex': 0.05,
    'images[0].sizey': 0.05
  });
}

function interpolate(x, xs, ys) {
  if (x > xs[xs.length - 1]) {
      x = xs[xs.length - 1];
  }
  for (let i = 0; i < xs.length - 1; i++) {
      if (x >= xs[i] && x <= xs[i + 1]) {
          let x1 = xs[i], x2 = xs[i + 1];
          let y1 = ys[i], y2 = ys[i + 1];
          return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
      }
  }
  throw new Error('x is out of bounds. x = ' + x + ', xs = ' + xs);
}

function dateToSerial(dateString) {
  // Parse the input date string
  let [month, day, year] = dateString.split('/').map(Number);

  // Create a date object for the input date
  let inputDate = new Date(year, month - 1, day);

  // Create a date object for January 1, 1 AD
  let startDate = new Date(1, 0, 1); // Month is zero-indexed

  // Calculate the difference in time (in milliseconds)
  let timeDifference = inputDate.getTime() - startDate.getTime();

  // Convert the difference from milliseconds to days
  let daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  return daysDifference+693962;
}


function serialToDate(serial) {
  // Calculate the date from the ordinal number
  let baseDate = new Date(1, 0, 1);
  let date = new Date(baseDate.getTime() + (serial - 1) * 24 * 60 * 60 * 1000);
  
  // Format the date as m/d/yyyy
  let day = date.getDate().toString();
  let month = (date.getMonth() + 1).toString(); // Add 1 to convert from 0-indexed to 1-indexed
  let year = (date.getFullYear()-1900).toString();
  let dateString = month + "/" + day + "/" + year;
  
  return dateString;
}



function draw_histogram(grades, cat, comp_time) {
  let grade_points = [];
  for (let i = 0; i < grades.length; i++) {
    let grade = grades[i];
    console.log(cat.includes('all') && cat.includes('All'))
    
    if ((cat.includes(grade['class'].toLowerCase()) || cat.includes('all')) && (cat.includes(grade['category'].toLowerCase()) || cat.includes('All'))) {
      grade_points.push(grade);
    }
  }
  // sort grades into groups based on same class and category
  let grade_groups = {};
  for (let i = 0; i < grade_points.length; i++) {
    let grade = grade_points[i];
    let key = grade['class'] + " " + grade['category'];
    if (key in grade_groups) {
      grade_groups[key].push(grade);
    } else {
      grade_groups[key] = [grade];
    }
  }
  let traces = [];
  let individualTraces = []; // Store individual traces
  // create a histogram for each group
  for (const key in grade_groups) {
    let group = grade_groups[key];
    let data = group.map(grade => grade['score']/grade['value']*100);
    
    // Calculate bandwidth based on data variance
    var bandwidth = Math.sqrt(data.reduce((acc, val) => acc + Math.pow(val - data.reduce((a, b) => a + b) / data.length, 2), 0) / data.length);
    bandwidth = Math.max(bandwidth, 0.5); // Ensure minimum bandwidth
    
    var kde = kernelDensityEstimation(data, epanechnikovKernel, bandwidth);
    // Plot the density estimate
    var trace = {
      x: kde.x,
      y: kde.y,
      mode: 'lines',
      name: key,
    };
    traces.push(trace);
    individualTraces.push({x: kde.x, y: kde.y}); // Store individual KDE
  }

var layout = {
    title: 'Grade Distribution',
    xaxis: {title: 'Grade', showgrid: false},
    yaxis: {title: 'Density', showgrid: false},
    showlegend: false,
    displayModeBar: false,
    paper_bgcolor: 'rgba(0,0,0,0)', // Transparent background
    plot_bgcolor: 'rgba(0,0,0,0)',  // Transparent plot area
    font: {
    color: 'white' // White text
  }
};
// Store the combined KDE
var data = grades.map(grade => grade['score']/grade['value']*100);
var kde = kernelDensityEstimation(data, epanechnikovKernel, bandwidth);
let combinedTrace = {
  x: kde.x,
  y: kde.y,
  name: 'Combined',
  hovertemplate: 'Combined<br>Grade: %{x:.1f}%<br>Density: %{y:.3f}<extra></extra>'
};

// Define tracenums
let tracenums = Array.from({length: traces.length}, (_, i) => i);


Plotly.newPlot('myHisto', traces, layout);
setTimeout(function(){
  animationHistogram(tracenums, Array(traces.length).fill(combinedTrace));
}, comp_time*500);

// Update the event listener for the checkbox
document.getElementById('componentsHisto').addEventListener('change', function() {
  if(this.checked) {
    animationHistogram(tracenums, individualTraces);
  } else {
    animationHistogram(tracenums, Array(traces.length).fill(combinedTrace));
  }
});
}

function animationHistogram(tracenums, traces){
  
  Plotly.animate('myHisto', {
    data: traces,
    traces: tracenums,
    layout: {}
  }, {
    transition: {
      duration: 3000,
      easing: 'cubic-in-out'
    },
    frame: {
      duration: 3000
    }
  });
  setTimeout(function(){
    console.log('resizing')
    Plotly.relayout('myHisto', {'yaxis.autorange': true});
  }, 4000);
}

// create a function to call draw_histogram and draw_gotc with all of the necessary parameters
function draw_graphs(grade_spreads, times, weights, grades, cat, val_sums, comp_time=0, goals){
  currentCategories = cat;
  draw_gotc(grade_spreads, times, weights, grades, cat, val_sums, comp_time, goals);
  draw_histogram(grades, cat, comp_time);
  draw_change_graph(grade_spreads, times, weights, cat, 15);
}

document.getElementById("class-form").addEventListener("submit", function(event) {
  event.preventDefault();
  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = "";
  const checkboxes = document.querySelectorAll('input[name="class"]:checked');
  const selectedClasses = Array.from(checkboxes).map(function(checkbox) {
    return checkbox.value;
  }).filter(value => value.toLowerCase() !== 'all'); // Filter out "All" from selections
  
  if (selectedClasses.length === 0) {
    errorMessage.textContent = "Please select at least one class.";
    return;
  }

  // Uncheck all component and individual grade checkboxes
  document.getElementById('components').checked = false;
  document.getElementById('individual').checked = false;
  document.getElementById('componentsHisto').checked = false;
  document.getElementById('componentsChange').checked = false;

  console.log(document.getElementById('loadingWheel').style.visibility)
  document.getElementById('loadingWheel').style.visibility = "visible";
  document.getElementById('loadingWheel').style.display = "block";
  
  let specificity = document.getElementById("mySlider").value;
  console.log(selectedClasses);
  draw_graphs(grade_spreads, times, weights, grades, selectedClasses, val_sums, specificity);
  console.log("done")
});




const insightContainer = document.getElementById("insightContainer");

function displayInsights(insights) {
  
  insights = insights.split('\n').filter(item => item.trim() !== '');
  for(let x=0;x<insights.length;x++){
    
  const box = document.createElement("div");
  box.className = "box";

  const lightbulb = document.createElement("div");
  lightbulb.className = "lightbulb";

  const text = document.createElement("span");
  text.textContent = insights[x];

  box.appendChild(lightbulb);
  box.appendChild(text);
  insightContainer.appendChild(box);
  }
  
}



async function getInsights(){
  document.getElementById('loadingWheel').style.visibility = "visible";
  const data = await fetchRequest('/insights', { data: '' });
  
  
  
  displayInsights(data);
  document.getElementById('loadingWheel').style.visibility = "hidden";

  }


function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = lower + 1;
  const weight = index % 1;

  if (upper >= sorted.length) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}



let slideIndex = 0;

        function moveSlide(n) {
            showSlide(slideIndex += n);
        }

        function currentSlide(n) {
            showSlide(slideIndex = n);
        }

        function showSlide(n) {
            const slides = document.querySelectorAll('.slide');
            const dots = document.querySelectorAll('.dot');
            
            if (n >= slides.length) slideIndex = 0;
            if (n < 0) slideIndex = slides.length - 1;
            
            slides.forEach(slide => slide.style.display = 'none');
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[slideIndex].style.display = 'flex';
            dots[slideIndex].classList.add('active');
        }

function setCompliments(compliments) {
    const carousel = document.getElementById("crs");
    const dotsContainer = document.querySelector(".dots");

    // Clear existing slides and dots
    carousel.innerHTML = '';
    dotsContainer.innerHTML = '';

    for (let x = 0; x < compliments.length; x++) {
        let slide = document.createElement("div");
        slide.className = "slide";
        let text = document.createElement("p");
        text.textContent = compliments[x];

        // Generate random color
        let randomColor = Math.floor(Math.random() * 16777215).toString(16);
        randomColor = randomColor.padStart(6, '0');
        console.log(randomColor);
        slide.style.backgroundColor = "#" + randomColor;

        slide.appendChild(text);
        carousel.appendChild(slide);

        // Create dot
        let dot = document.createElement("span");
        dot.className = "dot";
        dot.onclick = () => currentSlide(x);
        dotsContainer.appendChild(dot);
    }

    // Show the first slide
    showSlide(slideIndex);
}



// Epanechnikov kernel function
function epanechnikovKernel(u) {
  return Math.abs(u) <= 1 ? 0.75 * (1 - u * u) : 0;
}

// Kernel density estimation function
function kernelDensityEstimation(data, kernel, bandwidth) {
  var n = data.length;
  var xMin = Math.min.apply(null, data);
  var xMax = Math.max.apply(null, data);
  
  // Check if all values are the same
  if (xMin === xMax) {
    // Create a Gaussian-like hill centered at the single value
    var x = [], y = [];
    for (var i = 0; i < 100; i++) {
      var xi = xMin - 5 * bandwidth + i * (10 * bandwidth / 100);
      var yi = Math.exp(-Math.pow(xi - xMin, 2) / (2 * Math.pow(bandwidth, 2)));
      x.push(xi);
      y.push(yi);
    }
    return {x: x, y: y};
  }
  
  // Original KDE calculation for non-uniform data
  var xRange = xMax - xMin;
  var x = [], y = [];
  
  for (var i = 0; i < 100; i++) {
    var xi = xMin + i * (xRange / 100);
    var yi = 0;
    for (var j = 0; j < n; j++) {
      yi += kernel((xi - data[j]) / bandwidth);
    }
    yi /= (n * bandwidth);
    x.push(xi);
    y.push(yi);
  }
  return {x: x, y: y};
}


function shareStat(stat, id){
  text = first_name+"My"+" "+stat+" is "+document.getElementById(id).textContent+"! Check out my other stats on my bxsciweb profile!"
  navigator.share({
    title: first_name+"'s Grade Analytics",
    text: text,
    url: 'https://bxsciweb.org/users/'+osis
  })
}

async function shareGraph(id) {
  // Get the Plotly graph element
  var graph = document.getElementById(id)

  // Use html2canvas to take a screenshot of the div
  html2canvas(graph).then(canvas => {
    // Convert the canvas to a Blob
    canvas.toBlob(blob => {
      const file = new File([blob], "graph.png", { type: "image/png" });

      // Use the navigator.share API to share the image
      if (navigator.share) {
        navigator.share({
          title: 'Graph Image',
          text: 'Check out this graph!',
          files: [file]
        }).then(() => {
          console.log('Share successful');
        }).catch(error => {
          console.error('Error sharing', error);
        });
      } else {
        console.error('Web Share API not supported');
      }
    });
  }).catch(error => {
    console.error('Error taking screenshot', error);
  });
}

function setGoalTable(goals) {
  const tableBody = document.getElementById('goalTableBody');
  tableBody.innerHTML = '';

  if (!goals || !goals.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="7" style="text-align: center;">No goals set yet. Click "Add Goal Manually" or use "Click Graph to Add Goal" to get started.</td>';
    tableBody.appendChild(emptyRow);
    return;
  }

  goals.forEach(goal => {
    const row = document.createElement('tr');
    
    const dateSet = new Date(goal.date_set);
    const goalDate = new Date(goal.date);
    const today = new Date();
    const daysLeft = Math.ceil((goalDate - today) / (1000 * 60 * 60 * 24));
    
    const totalDays = Math.ceil((goalDate - dateSet) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.max(0, totalDays - daysLeft);
    const percentTimeComplete = Math.round((daysPassed / totalDays) * 100);

    // Get current grade and calculate progress with error handling
    let currentGrade = 0;
    let gradeWhenSet = 0;
    try {
      currentGrade = interpolate(dateToSerial(today.toLocaleDateString()), combinedx, combinedy) || 0;
      gradeWhenSet = interpolate(dateToSerial(goal.date_set), combinedx, combinedy) || 0;
    } catch (e) {
      console.error('Error calculating grades:', e);
    }

    const totalGradeChange = goal.grade - gradeWhenSet;
    const currentGradeChange = currentGrade - gradeWhenSet;
    const percentGradeComplete = Math.round((currentGradeChange / totalGradeChange) * 100) || 0;

    // Calculate if on track with error handling
    const expectedGrade = gradeWhenSet + (totalGradeChange * (daysPassed / totalDays));
    const percentAboveBelow = Math.round(((currentGrade - expectedGrade) || 0) * 100) / 100;
    
    let status = '';
    if (percentAboveBelow >= 0) {
      status = '<span class="goal-status on-track">On Track</span>';
    } else if (percentAboveBelow >= -5) {
      status = '<span class="goal-status at-risk">At Risk</span>';
    } else {
      status = '<span class="goal-status behind">Behind</span>';
    }

    // Create progress bar with error handling
    const progressBar = `
      <div class="goal-progress-bar">
        <div class="goal-progress-fill" style="width: ${Math.max(0, Math.min(100, percentGradeComplete || 0))}%"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.8em;">
        <span>${(currentGrade || 0).toFixed(1)}%</span>
        <span>${goal.grade.toFixed(1)}%</span>
      </div>
    `;

    // Create trend indicator with error handling
    const trend = `
      <div class="trend-sparkline">
        ${percentAboveBelow >= 0 ? '↗️' : '↘️'} ${Math.abs(percentAboveBelow || 0).toFixed(1)}%
      </div>
    `;

    row.innerHTML = `
      <td>${status}</td>
      <td>${goal.class}/${goal.category}</td>
      <td>${progressBar}</td>
      <td>${goal.grade.toFixed(1)}%</td>
      <td>${formatDueDate(goal.date)} (${daysLeft} days)</td>
      <td>${trend}</td>
      <td>
        <div class="goal-actions">
          <button class="goal-action-btn edit-goal" title="Edit Goal" data-id="${goal.id}">✏️</button>
          <button class="goal-action-btn delete-goal" title="Delete Goal" data-id="${goal.id}">🗑️</button>
          ${goal.notes ? '<button class="goal-action-btn view-notes" title="View Notes" data-notes="' + goal.notes + '">📝</button>' : ''}
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Add event listeners for actions
  document.querySelectorAll('.delete-goal').forEach(button => {
    button.addEventListener('click', async () => {
      const goalId = button.dataset.id;
      if (confirm('Are you sure you want to delete this goal?')) {
        goals = await deleteGoal(goalId);
        draw_graphs(grade_spreads, times, weights, grades, currentCategories, val_sums, 5, goals);
        setGoalTable(goals);
      }
    });
  });

  document.querySelectorAll('.edit-goal').forEach(button => {
    button.addEventListener('click', () => {
      const goalId = button.dataset.id;
      const goal = goals.find(g => g.id === parseInt(goalId));
      openEditGoalModal(goal);
    });
  });

  document.querySelectorAll('.view-notes').forEach(button => {
    button.addEventListener('click', () => {
      alert(button.dataset.notes);
    });
  });
}

async function deleteGoal(goalId) {
  await fetchRequest('/delete_data', { sheet: "Goals", row_name: "id", row_value: parseInt(goalId) });
  goals = goals.filter(goal => parseInt(goal.id) != parseInt(goalId));
  return goals
}

function draw_change_graph(grade_spreads, times, weights, cat, timeframe=15) {
  // Filter spreads based on categories like in draw_gotc
  let spreads = [];
  let spread_names = [];
  let w = [];
  for (const spread_class in grade_spreads) {
    for (const spread_category in grade_spreads[spread_class]) {
      let spread = grade_spreads[spread_class][spread_category];
      if ((cat.includes(spread_class.toLowerCase()) || cat.includes('all')) && 
          (cat.includes(spread_category.toLowerCase()) || cat.includes('All'))) {
        spreads.push(spread);
        spread_names.push(spread_category + " " + spread_class);
        w.push(weights[spread_class][spread_category]);
      }
    }
  }

  // Calculate grade changes for each timeframe
  let changes = [];
  let periods = [];
  
  // Convert timeframe from days to number of data points
  const pointsPerDay = times.length / (times[times.length-1] - times[0]);
  const pointsPerFrame = Math.round(timeframe * pointsPerDay);
  
  for (let i = pointsPerFrame; i < times.length; i += pointsPerFrame) {
    let periodStart = times[i - pointsPerFrame];
    let periodEnd = times[i];
    
    // Format dates without years
    const startDate = serialToDate(periodStart).split('/');
    const endDate = serialToDate(periodEnd).split('/');
    periods.push(`${startDate[0]}/${startDate[1]} to ${endDate[0]}/${endDate[1]}`);
    
    // Calculate changes for each spread
    let periodChanges = spreads.map(spread => {
      return spread[i] - spread[i - pointsPerFrame];
    });
    changes.push(periodChanges);
  }

  // Calculate combined changes (weighted average)
  let combinedChanges = changes.map(periodChanges => {
    let weightedSum = 0;
    let weightSum = 0;
    for (let i = 0; i < periodChanges.length; i++) {
      weightedSum += periodChanges[i] * w[i];
      weightSum += w[i];
    }
    return weightedSum / weightSum;
  });

  // Define a color palette for components
  const colorPalette = [
    'rgba(228, 76, 101, 0.7)',  // Pink
    'rgba(55, 128, 191, 0.7)',  // Blue
    'rgba(50, 171, 96, 0.7)',   // Green
    'rgba(255, 193, 7, 0.7)',   // Yellow
    'rgba(153, 102, 255, 0.7)', // Purple
    'rgba(255, 159, 64, 0.7)',  // Orange
    'rgba(201, 203, 207, 0.7)', // Grey
    'rgba(75, 192, 192, 0.7)',  // Teal
    'rgba(255, 99, 132, 0.7)',  // Red
    'rgba(54, 162, 235, 0.7)'   // Light Blue
  ];

  // Create traces for each spread with unique colors and filter small changes
  let traces = [];
  for (let i = 0; i < spreads.length; i++) {
    const spreadChanges = changes.map(change => change[i]);
    
    if (spreadChanges.some(change => Math.abs(change) >= 0.1)) {
      let trace = {
        x: periods,
        y: spreadChanges.map(change => Math.abs(change) >= 0.1 ? change : 0),
        type: 'bar',
        name: spread_names[i],
        marker: {
          color: colorPalette[i % colorPalette.length]
        },
        hovertemplate: '%{y:.1f}%<br>%{x}<extra>' + spread_names[i] + '</extra>'
      };
      traces.push(trace);
    }
  }

  // Create combined trace
  let combinedTrace = [{
    x: periods,
    y: combinedChanges,
    type: 'bar',
    marker: {
      color: combinedChanges.map(change => 
        change >= 0 ? 'rgba(228, 76, 101, 0.7)' : 'rgba(55, 128, 191, 0.7)')
    },
    hovertemplate: '%{y:.1f}%<br>%{x}<extra>Combined</extra>'
  }];

  let layout = {
    title: 'Grade Changes by Time Period',
    barmode: 'stack',
    hovermode: 'closest',  // Only show closest hover
    yaxis: {
      title: 'Grade Change (%)',
      zeroline: true,
      zerolinecolor: 'white',
      zerolinewidth: 2,
      showgrid: false,
      range: [
        Math.min(...combinedChanges.concat(...changes.flat())) * 1.1,
        Math.max(...combinedChanges.concat(...changes.flat())) * 1.1
      ]
    },
    xaxis: {
      title: 'Time Period',
      showgrid: false,
      tickangle: -45
    },
    showlegend: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: 'white' }
  };

  // Initial plot with combined trace
  Plotly.newPlot('myChangeGraph', combinedTrace, layout)
    .then(() => {
      Plotly.relayout('myChangeGraph', {
        'yaxis.autorange': true
      });
    });

  // Remove existing event listeners
  const componentsCheckbox = document.getElementById('componentsChange');
  const timeframeSlider = document.getElementById('timeframeSlider');
  
  componentsCheckbox.removeEventListener('change', componentsCheckbox.changeHandler);
  timeframeSlider.removeEventListener('input', timeframeSlider.inputHandler);

  // Add new event listener for components toggle
  componentsCheckbox.changeHandler = function() {
    if (this.checked) {
      // When showing components, update the entire data array at once
      Plotly.react('myChangeGraph', traces, {
        ...layout,
        barmode: 'stack'
      }).then(() => {
        Plotly.relayout('myChangeGraph', {
          'yaxis.autorange': true
        });
      });
    } else {
      // When showing combined, update to single trace
      Plotly.react('myChangeGraph', combinedTrace, {
        ...layout,
        barmode: 'group'
      }).then(() => {
        Plotly.relayout('myChangeGraph', {
          'yaxis.autorange': true
        });
      });
    }
  };
  componentsCheckbox.addEventListener('change', componentsCheckbox.changeHandler);

  // Add debounced event listener for timeframe slider
  let timeoutId = null;
  timeframeSlider.inputHandler = function() {
    const value = this.value;
    document.getElementById('timeframeValue').textContent = value;
    
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout
    timeoutId = setTimeout(() => {
      draw_change_graph(grade_spreads, times, weights, cat, parseInt(value));
    }, 250); // Wait 250ms after last change before redrawing
  };
  timeframeSlider.addEventListener('input', timeframeSlider.inputHandler);
}

// when the user types in the input field, search and display allgrades for which the name matches

let currentController = null;

document.getElementById('gradeSearch').addEventListener('keyup', function() {
    // Abort previous search if it exists
    if (currentController) {
        currentController.abort();
    }

    // Create new controller for this search
    currentController = new AbortController();
    const signal = currentController.signal;

    const searchTerm = this.value.toLowerCase();
    
    try {
        document.querySelectorAll('.result-item').forEach(item => {
            // Check if search was aborted
            if (signal.aborted) {
                throw new Error('aborted');
            }
            
            if (item.textContent.toLowerCase().includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    } catch (e) {
        if (e.message === 'aborted') {
            return; // Exit if search was aborted
        }
        throw e; // Re-throw if it's a different error
    }
});

function displayGrades(grades) {
  const resultsDiv = document.getElementById('searchResults')
  grades.forEach(grade => {
    const resultItem = document.createElement('div');
    resultItem.style.display = 'none';
    resultItem.className = 'result-item';
    
    const info = document.createElement('span');
    info.textContent = `${grade.name} - ${grade.category}`;
    
    const button = document.createElement('button');
    button.className = 'opt-in-btn';
    
    // Find matching distribution
    const dist = currentDistributions.find(d => d.name === grade.name && d.class_name === grade.class);
    const opted_in = dist?.OSIS?.includes(osis);
    
    button.textContent = opted_in ? 'View Distribution' : 'Opt In';
    
    // Create separate handlers for view and opt-in
    if (opted_in && dist) {
      button.onclick = function() {
        console.log("Viewing existing distribution:", dist);
        graphDistribution(dist, grade);
      };
    } else {
      button.onclick = function() {
        console.log("Opting into distribution");
        optInDistribution(grade, dist);
      };
    }
    
    resultItem.appendChild(info);
    resultItem.appendChild(button);
    resultsDiv.appendChild(resultItem);
  });
}

function graphDistribution(dist, grade) {
  console.log("Graphing distribution:", dist);
  if (!dist.scores || dist.scores.length === 0) {
    console.error("No scores available for distribution");
    return;
  }

  const data = dist.scores.map(score => score / dist.value * 100);
  
  // Calculate bandwidth based on data variance
  const bandwidth = Math.max(
    Math.sqrt(data.reduce((acc, val) => 
      acc + Math.pow(val - data.reduce((a, b) => a + b) / data.length, 2), 0
    ) / data.length),
    0.5
  );
  
  const kde = kernelDensityEstimation(data, epanechnikovKernel, bandwidth);
  
  // Distribution curve
  const distributionTrace = {
    x: kde.x,
    y: kde.y,
    mode: 'lines',
    name: `${dist.class_name} - ${dist.name}`,
    line: {
      color: 'rgb(228, 76, 101)'
    }
  };
  
  // User's grade point
  const userScore = grade ? grade.score / grade.value * 100 : 
                   dist.scores[dist.OSIS.indexOf(osis)] / dist.value * 100;
  
  const userGradeTrace = {
    x: [userScore],
    y: [0], // Place at bottom of graph
    mode: 'markers',
    name: 'Your Grade',
    marker: {
      size: 12,
      color: 'white',
      symbol: 'diamond'
    }
  };
  
  const layout = {
    title: 'Grade Distribution',
    xaxis: {title: 'Grade (%)', showgrid: false},
    yaxis: {title: 'Density', showgrid: false},
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: 'white' },
    showlegend: true,
    legend: {
      x: 1,
      y: 1
    }
  };
  
  Plotly.newPlot('distributionGraph', [distributionTrace, userGradeTrace], layout);
}

async function optInDistribution(grade, dist) {
  console.log("Opting in with grade:", grade, "and existing dist:", dist);
  // if dist is undefined, create a new distribution
  if (dist === undefined) {
    dist = {
      name: grade.name,
      OSIS: [osis],
      scores: [grade.score],
      class_name: grade.class,
      category: grade.category,
      value: grade.value,
      id: Math.floor(Math.random() * 100000000)
    }
    await fetchRequest('/post_data', { sheet: "Distributions", data: dist });
  }
  else {
    // add the osis and score to the distribution
    dist.OSIS.push(osis);
    dist.scores.push(grade.score);
    // post the distribution to the database
    await fetchRequest('/update_data', { sheet: "Distributions", row_name: "id", row_value: dist.id, data: dist });
  }
  // update the distribution table
  graphDistribution(dist);
}

document.addEventListener('DOMContentLoaded', function() {
  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
    });
  });

  // Collapsible functionality
  const collapsibles = document.querySelectorAll('.collapsible-button');
  collapsibles.forEach(button => {
    button.addEventListener('click', () => {
      const content = button.parentElement;
      content.classList.toggle('active');
    });
  });
});

function calculateClassComponents(spreads, weights, spread_names, w) {
    let classComponents = {};
    let classWeights = {};

    // First pass: Group by class name and accumulate weighted values
    for (let i = 0; i < spreads.length; i++) {
        // Get category and class name by finding the first occurrence of a class name from weights
        let fullName = spread_names[i];
        let className = null;
        
        // Find which class this spread belongs to by checking weights keys
        for (let possibleClass in weights) {
            if (fullName.includes(possibleClass)) {
                className = possibleClass;
                break;
            }
        }
        
        // Skip if we couldn't find a matching class
        if (!className) continue;
        
        let weight = w[i];
        
        if (!classComponents[className]) {
            classComponents[className] = Array(spreads[i].length).fill(0);
            classWeights[className] = {};
        }
        
        // Add values without weights initially
        for (let j = 0; j < spreads[i].length; j++) {
            if (spreads[i][j] !== 99.993) {
                if (!classComponents[className][j]) {
                    classComponents[className][j] = {
                        sum: 0,
                        weightSum: 0
                    };
                }
                classComponents[className][j].sum += spreads[i][j] * weight;
                classComponents[className][j].weightSum += weight;
            }
        }
    }

    // Create traces with properly weighted averages
    let classTraces = [];
    for (let className in classComponents) {
        // Calculate weighted average at each time point
        let weightedAverage = classComponents[className].map(point => 
            point && point.weightSum > 0 ? point.sum / point.weightSum : null
        );
        
        // Filter out null values
        weightedAverage = weightedAverage.map(val => val === null ? 100 : val);

        let trace = {
            x: times,
            y: weightedAverage,
            mode: 'lines',
            name: className,
            line: {
                color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                width: 2
            },
            hovertemplate: `${className}<br>Date: %{x}<br>Grade: %{y:.1f}%<extra>${className}</extra>`
        };
        classTraces.push(trace);
    }

    return classTraces;
}

// Goal Management Functions
let isClickToAddActive = false;
let clickIndicator = null;

function initializeGoalModal() {
  // Get all the necessary elements
  const modal = document.getElementById('goalModal');
  const closeBtn = document.querySelector('.goal-modal-close');
  const addGoalBtn = document.getElementById('addGoal');
  const clickToAddBtn = document.getElementById('clickToAddGoal');
  const goalForm = document.getElementById('goalForm');

  // Add click handler for manual goal entry
  addGoalBtn.addEventListener('click', () => {
    // Reset form and show modal
    goalForm.reset();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('goalDate').min = today;
    
    // Reset goal type buttons
    document.querySelectorAll('.goal-type-button').forEach(btn => {
      btn.classList.remove('active');
      btn.style.backgroundColor = 'transparent';
    });
    document.querySelector('[data-type="grade"]').classList.add('active');
    document.querySelector('[data-type="grade"]').style.backgroundColor = 'rgb(228, 76, 101)';
    
    // Show modal
    modal.style.display = 'block';
  });

  // Rest of the initialization code remains the same...
}

function formatDueDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

