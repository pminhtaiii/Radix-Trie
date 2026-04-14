import { useEffect, useRef } from "react";
import * as d3 from "d3";

const R = 16;
const M = { top: 24, right: 180, bottom: 24, left: 56 };

export default function TrieVisualization({ trieData, highlightWord }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!trieData || !svgRef.current) return;
    const el = svgRef.current;
    const W = el.parentElement.clientWidth || 760;
    const H = el.parentElement.clientHeight || 580;

    const svg = d3.select(el);
    svg.selectAll("*").remove();

    const root = d3.hierarchy(trieData, d => d.children);
    d3.tree()
      .size([H - M.top - M.bottom, W - M.left - M.right])
      .separation((a, b) => (a.parent === b.parent ? 1.4 : 2))(root);

    // Highlight set — words along the search path
    const hlSet = new Set();
    if (highlightWord) {
      let acc = "";
      root.descendants().forEach(d => {
        if (d.data.name === "ROOT" || d.data.name === "★") { hlSet.add(d); return; }
        acc += d.data.name;
        if (highlightWord.startsWith(acc) || acc === highlightWord) hlSet.add(d);
      });
    }

    const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

    // zoom
    svg.call(d3.zoom().scaleExtent([0.25, 4])
      .on("zoom", ev => g.attr("transform", ev.transform)));

    // ── Links ──
    g.selectAll(".lk")
      .data(root.links()).join("path")
      .attr("class", "lk")
      .attr("fill", "none")
      .attr("stroke", d => hlSet.has(d.target) ? "rgba(123,111,255,.5)" : "#1f1f2e")
      .attr("stroke-width", d => hlSet.has(d.target) ? 1.5 : 1)
      .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x))
      .style("opacity", 0)
      .transition().duration(500).style("opacity", 1);

    // ── Nodes ──
    const node = g.selectAll(".nd")
      .data(root.descendants()).join("g")
      .attr("class", "nd")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    const isWord = d => d.data.attributes && Object.keys(d.data.attributes).length > 0;

    // Outer glow ring (word nodes only)
    node.filter(isWord)
      .append("circle")
      .attr("r", R + 6)
      .attr("fill", "rgba(123,111,255,.06)")
      .attr("stroke", "rgba(123,111,255,.15)")
      .attr("stroke-width", 1);

    // Main circle
    node.append("circle")
      .attr("r", 0)
      .attr("fill", d => {
        if (hlSet.has(d) && isWord(d)) return "#7b6fff";
        if (hlSet.has(d))              return "#1f1f30";
        if (isWord(d))                 return "#18182a";
        return "#0f0f18";
      })
      .attr("stroke", d => {
        if (hlSet.has(d) && isWord(d)) return "#9b8fff";
        if (hlSet.has(d))              return "#7b6fff";
        if (isWord(d))                 return "#3a3860";
        return "#1f1f2e";
      })
      .attr("stroke-width", d => hlSet.has(d) ? 1.5 : 1)
      .transition().duration(450)
      .attr("r", d => isWord(d) ? R + 2 : R);

    // Label inside circle
    node.append("text")
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("fill", d => {
        if (hlSet.has(d) && isWord(d)) return "#fff";
        if (isWord(d)) return "#c0b8ff";
        return "#585870";
      })
      .attr("font-size", "10px").attr("font-weight", "500")
      .attr("pointer-events", "none")
      .text(d => d.data.name === "ROOT" ? "root" : d.data.name);

    // Definition label (right side, word nodes)
    node.filter(isWord)
      .append("text")
      .attr("x", R + 10).attr("dy", "0.35em")
      .attr("fill", d => hlSet.has(d) ? "#c0b8ff" : "#585870")
      .attr("font-size", "10px")
      .text(d => {
        const m = d.data.attributes["Nghĩa"] || "";
        return m.length > 20 ? m.slice(0, 20) + "…" : m;
      });

    // hover
    node.style("cursor", d => isWord(d) ? "pointer" : "default")
      .on("mouseover", function (_, d) {
        d3.select(this).select("circle")
          .transition().duration(120)
          .attr("stroke", "#7b6fff")
          .attr("stroke-width", 2);
      })
      .on("mouseout", function (_, d) {
        d3.select(this).select("circle")
          .transition().duration(120)
          .attr("stroke", hlSet.has(d) && isWord(d) ? "#9b8fff"
            : hlSet.has(d) ? "#7b6fff"
            : isWord(d) ? "#3a3860" : "#1f1f2e")
          .attr("stroke-width", hlSet.has(d) ? 1.5 : 1);
      });

  }, [trieData, highlightWord]);

  return <svg ref={svgRef} style={{ width: "100%", height: "100%", minHeight: 480 }} />;
}
