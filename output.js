window.onload = loadHistory;

async function loadHistory() {

  const response = await fetch(
    "http://localhost:8000/history"
  );

  const queries = await response.json();

  const list = document.getElementById("queryList");

  list.innerHTML = "";

  queries.forEach(q => {

    const li = document.createElement("li");

    li.textContent =
      q.query_text.substring(0, 50);

    li.onclick = () => loadQuery(q.id);

    list.appendChild(li);

  });
}

async function loadQuery(id) {

  const response = await fetch(
    `http://localhost:8000/history/${id}`
  );

  const data = await response.json();

  // fill textarea
  document.getElementById("query").value =
    data.query_text;

  // render plan
  drawTree(data.plan_json);

}


async function analyze() {
            const query=document.getElementById("query").value;
            const res = await fetch("http://localhost:8000/analyze",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify({query})
            });

            const data= await res.json();
            console.log(data);
            document.getElementById("output").textContent=JSON.stringify(data,null,2);
            drawTree(data); //send to D3
            document.getElementById("detailsContent").innerHTML="Click a node to view details.";
            await loadHistory();
}

function drawTree(data) {
  d3.select("#tree").html(""); // clear old

  const width = 800;
  const height = 500;

  const svg = d3.select("#tree")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g").attr("transform", "translate(50,50)");

  // Convert data to hierarchy
  const root = d3.hierarchy(data, d => d.children);

  const treeLayout = d3.tree().size([height - 100, width - 200]);
  treeLayout(root);

  // Draw links
  g.selectAll(".link")
    .data(root.links())
    .enter()
    .append("line")
    .attr("x1", d => d.source.y)
    .attr("y1", d => d.source.x)
    .attr("x2", d => d.target.y)
    .attr("y2", d => d.target.x)
    .attr("stroke", "#999");

  // Draw nodes
  const nodes = g.selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  nodes.append("circle")
    .attr("r", 6)
    .attr("fill", "steelblue");

  nodes.append("text")
    .text(d => d.data.type)
    // .text(d=> `Cost:${d.data.cost}\nRows: ${d.data.rows}`)
    .attr("x", 10)
    .attr("y", 3)
    .attr("fill", d => d.data.cost > 100 ? "red" : "green");

  nodes.append("title").text(d=> `Cost:${d.data.cost}\nRows: ${d.data.rows}`);

    svg.call(d3.zoom().on("zoom", (event) => {
    g.attr("transform", event.transform);
    }));

    // nodes.on("click", function(event, d) {
    // showDetails(d.data);  
    // });

    nodes.on("click", function(event, d) {
    // reset all nodes
    d3.selectAll("circle").attr("stroke", "none");

    // highlight clicked node
    d3.select(this).select("circle")
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    showDetails(d.data);
    });

}


function showDetails(data) {
  const panel = document.getElementById("detailsContent");

  panel.innerHTML = `
    <p><strong>Type:</strong> ${data.type}</p>
    <p><strong>Table:</strong> ${data.relationName || "N/A"}</p>
    <p><strong>Cost:</strong> ${data.cost}</p>
    <p><strong>Actual Rows:</strong> ${data.actualRows || "N/A"}</p>
    <p><strong>Time:</strong> ${data.time || "N/A"} ms</p>
    <p><strong>Filter:</strong> ${data.filter || "None"}</p>
    <p><strong>Loops:</strong> ${data.loops || 1}</p>
  `;

  const insights = getInsights(data);

    panel.innerHTML += `
    <h4>Insights</h4>
    ${insights.map(i => `<p>${i}</p>`).join("")}
    `;
}


function getInsights(data) {
  let insights = [];

  if (data.type === "Seq Scan") {
    insights.push("⚠️ Full table scan → consider index");
  }

  // Index Scan
  if (data.type === "Index Scan") {
        insights.push("✅ Index Scan detected. An index is being used efficiently.");
  }

  // Nested Loop
  if (data.type === "Nested Loop") {
        insights.push("⚠ Nested Loop detected. Can become expensive for large datasets.");
  }

  // Hash Join
    if (data.type === "Hash Join") {
        insights.push("✅ Hash Join is efficient for large unsorted datasets.");
    }

    // Merge Join
    if (data.type === "Merge Join") {
        insights.push("✅ Merge Join performs well when both inputs are sorted.");
    }

    // Aggregate
    if (data.type.includes("Aggregate")) {
        insights.push("ℹ Aggregation operation detected.");
    }

  if (data.actualRows > 1000) {
    insights.push("⚠️ Large data processing (>1000 rows)");
  }

  // High cost
    if (data.cost > 1000) {
        insights.push("🔥 High execution cost. This operation deserves attention.");
    }



    // Multiple loops
    if (data.loops > 1) {
        insights.push(`⚠ Operation executed ${data.loops} times.`);
    }

    


  return insights;
}