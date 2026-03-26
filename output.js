async function analyze() {
            const query=document.getElementById("query").value;
            const res = await fetch("http://localhost:8000/analyze",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify({query})
            });

            const data= await res.json();
            document.getElementById("output").textContent=JSON.stringify(data,null,2);

            drawTree(data); //send to D3
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
    .attr("x", 10)
    .attr("y", 3);
}