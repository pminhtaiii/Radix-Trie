import { useEffect, useRef } from "react";
import * as d3 from "d3";

const R = 20; // Slightly larger nodes for better visibility
const M = { top: 40, right: 200, bottom: 40, left: 80 };

export default function TrieVisualization({ trieData, highlightWord, highlightType }) {
  const svgRef = useRef(null);

  // Define colors based on action type
  const isAdd = highlightType === "add";
  const hlColor = isAdd ? "#10b981" : "#8b5cf6"; // Emerald for add, Violet for search
  const hlColorDark = isAdd ? "#059669" : "#7c3aed";
  const hlColorText = isAdd ? "#047857" : "#6d28d9";
  const hlColorBg = isAdd ? "rgba(16, 185, 129, 0.2)" : "rgba(139, 92, 246, 0.2)";

  useEffect(() => {
    if (!trieData || !svgRef.current) return;
    const el = svgRef.current;
    
    // Get container dimensions
    const container = el.parentElement;
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;

    const svg = d3.select(el);
    svg.selectAll("*").remove();

    // Create a hierarchy from the trie data
    const root = d3.hierarchy(trieData, d => d.children);
    
    // Configure the tree layout
    const treeLayout = d3.tree()
      .size([H - M.top - M.bottom, W - M.left - M.right])
      .separation((a, b) => (a.parent === b.parent ? 1.5 : 2.5));
      
    // Create the tree layout
    treeLayout(root);

    // Keep track of highlighted path
    const hlSet = new Set();
    if (highlightWord && highlightWord.trim() !== "") {
      // Find the exact path for the highlighted word
      let currentWord = "";
      
      // Define a custom search to highlight exact prefix path
      const checkNode = (node, prefix) => {
        if (!node) return;
        
        let nodePrefix = prefix;
        if (node.data.name !== "ROOT" && node.data.name !== "★") {
          nodePrefix += node.data.name;
        }

        // Add root to highlighted list 
        if (node.data.name === "ROOT" || node.data.name === "★") {
           hlSet.add(node);
        } else if (highlightWord.startsWith(nodePrefix)) {
           hlSet.add(node);
        } else if (nodePrefix === highlightWord) {
           hlSet.add(node);
        }

        // Check children
        if (node.children) {
          node.children.forEach(child => checkNode(child, nodePrefix));
        }
      };
      
      checkNode(root, "");
    }

    // Main group for zoom/pan
    const g = svg.append("g");

    // Enable zooming and panning
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on("zoom", ev => g.attr("transform", ev.transform));
      
    svg.call(zoom);
    
    // Center the tree initially
    const initialTransform = d3.zoomIdentity
      .translate(M.left, M.top)
      .scale(1);
    svg.call(zoom.transform, initialTransform);

    const R = 20; // Height base parameter (used somewhat similarly to before but expanded)
    
    // Instead of a fixed small rect, let's calculate width based on text length
    const getNodeWidth = d => {
        const text = d.data.name === "ROOT" ? "ROOT" : d.data.name;
        // Approx 8px per character + some padding. Min width 40 or 50px
        let w = Math.max(40, text.length * 9 + 20);
        if (isWord(d)) w += 10; // extra padding for word nodes
        return w;
    };
    
    // ==========================================
    // DRAW LINKS (EDGES)
    // ==========================================
    // Function to draw curve paths
    const linkGenerator = d3.linkHorizontal().x(d => d.y).y(d => d.x);

    g.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      // Update link colors based on highlight type
      .attr("stroke", d => hlSet.has(d.target) ? hlColor : "#cbd5e1")
      .attr("stroke-width", d => hlSet.has(d.target) ? 3 : 1.5)
      .attr("d", linkGenerator)
      .style("opacity", 0)
      .transition()
      .duration(600)
      .style("opacity", 1);

    // ==========================================
    // DRAW NODES
    // ==========================================
    const node = g.selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    // Helper: is this node a complete word?
    const isWord = d => d.data.attributes && Object.keys(d.data.attributes).length > 0;

    // Optional: Outer glow / halo effect for complete words
    node.filter(isWord)
      .append("rect")
      .attr("x", d => -(getNodeWidth(d) / 2 + 5))
      .attr("y", -17)
      .attr("width", d => getNodeWidth(d) + 10)
      .attr("height", 34)
      .attr("rx", 17)
      .attr("fill", "none")
      .attr("stroke", d => hlSet.has(d) ? hlColorBg : "rgba(226, 232, 240, 0.4)")
      .attr("stroke-width", d => hlSet.has(d) ? 4 : 2);

    // Main node shape (Rounded Pill Shape)
    node.append("rect")
      .attr("class", "main-shape")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", 0)
      .attr("rx", 14) // Pill shape curvature
      .attr("fill", d => {
        if (hlSet.has(d) && isWord(d)) return hlColor; // Highlight primary for highlighted words
        if (hlSet.has(d))              return "#f1f5f9"; // Very light gray for highlighted path nodes
        if (isWord(d))                 return "#4f46e5"; // Indigo for normal word nodes
        if (d.data.name === "ROOT")    return "#ffffff"; // White for Root
        return "#ffffff"; // White for standard nodes
      })
      .attr("stroke", d => {
        if (hlSet.has(d) && isWord(d)) return hlColor; // Match background for a flat look
        if (hlSet.has(d))              return hlColorBg; // Very subtle outline for path
        if (isWord(d))                 return "#4f46e5"; // Match background for a flat look
        return "#e2e8f0"; // Very light subtle border for others
      })
      .attr("stroke-width", d => (hlSet.has(d) || isWord(d) ? 1.5 : 1))
      // Animation
      .transition()
      .duration(500)
      .attr("x", d => -(getNodeWidth(d) / 2))
      .attr("y", -14)
      .attr("width", d => getNodeWidth(d))
      .attr("height", 28)
      .attr("box-shadow", "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)");

    // Text inside the pill (The Character String)
    node.append("text")
      .attr("dy", "0.32em")
      .attr("text-anchor", "middle")
      .attr("fill", d => {
        if (hlSet.has(d) && isWord(d)) return "#ffffff"; // White text inside highlighted violet node
        if (isWord(d))                 return "#ffffff"; // White text inside normal indigo node
        return "#334155"; // Dark gray text inside other nodes
      })
      .attr("font-size", "14px")
      .attr("font-weight", d => isWord(d) || hlSet.has(d) ? "600" : "500")
      .attr("font-family", "'Inter', sans-serif")
      .attr("pointer-events", "none")
      .text(d => d.data.name === "ROOT" ? "ROOT" : d.data.name);

    // Definition / Attribute label background (Badge underneath)
    const meaningBadgeStr = d => {
        const meaning = d.data.attributes["Nghĩa"] || "";
        return meaning.length > 25 ? meaning.slice(0, 25) + "…" : meaning;
    };
    
    const badgeGroup = node.filter(isWord)
      .append("g")
      .attr("class", "meaning-badge")
      .style("opacity", 0);
      
    // Text for meaning to measure width first
    const badgeText = badgeGroup.append("text")
      .attr("class", "badge-text")
      .attr("y", 26) // Position below main node
      .attr("dy", "0.32em")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff") // White text inside badge
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("font-family", "'Inter', sans-serif")
      .text(meaningBadgeStr);
      
    // Rect background for meaning directly below the text
    badgeGroup.insert("rect", "text")
      .attr("class", "badge-bg")
      .attr("x", function(d) { 
         // estimate text width, or we can just use length
         const txtLen = meaningBadgeStr(d).length;
         return -(txtLen * 6.5 + 16) / 2;
      })
      .attr("y", 18)
      .attr("width", function(d) {
         const txtLen = meaningBadgeStr(d).length;
         return txtLen * 6.5 + 16;
      })
      .attr("height", 16)
      .attr("rx", 4)
      .attr("fill", d => hlSet.has(d) ? hlColorDark : "#64748b"); // Match theme

    badgeGroup.transition()
      .delay(400)
      .duration(400)
      .style("opacity", 1);

    // Add interactivity hooks (Hover effects)
    node.style("cursor", d => isWord(d) ? "pointer" : "default")
      .on("mouseover", function (event, d) {
        // Enlarge main node
        const selNode = d3.select(this).select(".main-shape");
        const baseW = getNodeWidth(d);
        selNode.transition()
          .duration(200)
          .attr("x", -(baseW / 2 + 2))
          .attr("y", -16)
          .attr("width", baseW + 4)
          .attr("height", 32)
          .attr("stroke-width", 3);
          
        if (isWord(d)) {
          // Highlight definition badge background slightly
          d3.select(this).select(".badge-bg")
            .transition()
            .duration(200)
            .attr("fill", hlColorText);
        }
      })
      .on("mouseout", function (event, d) {
        // Restore main node
        const baseW = getNodeWidth(d);
        d3.select(this).select(".main-shape")
          .transition()
          .duration(200)
          .attr("x", -(baseW / 2))
          .attr("y", -14)
          .attr("width", baseW)
          .attr("height", 28)
          .attr("stroke-width", (hlSet.has(d) || isWord(d) ? 1.5 : 1));
          
        if (isWord(d)) {
          // Restore definition badge background
          d3.select(this).select(".badge-bg")
            .transition()
            .duration(200)
            .attr("fill", hlSet.has(d) ? hlColorDark : "#64748b");
        }
      });

  }, [trieData, highlightWord, highlightType]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", backgroundColor: "#f8fafc", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
      {/* Legend / Key map */}
      <div style={{
        position: "absolute", top: "16px", left: "16px", zIndex: 10,
        backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(4px)",
        border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#475569"
      }}>
        <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "8px", fontSize: "13px" }}>Legend</div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <div style={{ width: "14px", height: "14px", borderRadius: "4px", backgroundColor: "#4f46e5" }}></div>
          <span>Word Node</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <div style={{ width: "14px", height: "14px", borderRadius: "4px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}></div>
          <span>Prefix Node</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <div style={{ width: "14px", height: "14px", borderRadius: "4px", backgroundColor: "#8b5cf6" }}></div>
          <span>Searched Path</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "14px", height: "14px", borderRadius: "4px", backgroundColor: "#10b981" }}></div>
          <span>Added Path</span>
        </div>
      </div>
      <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
