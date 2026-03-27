const express = require("express");
const dns = require("dns").promises;
const path = require("path");

const app = express();
const PORT = 3000;

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// DNS lookup endpoint
app.get("/dns", async (req, res) => {
    const domain = req.query.domain;

    if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
    }

    try {
        // Run all lookups in parallel
        const results = await Promise.allSettled([
            dns.resolve4(domain),
            dns.resolve6(domain),
            dns.resolveMx(domain),
            dns.resolveNs(domain),
            dns.resolveTxt(domain),
            dns.resolveCname(domain),
            dns.resolveSrv(domain),
            dns.resolvePtr(domain),
            dns.resolveSoa(domain)
        ]);

        const types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SRV", "PTR", "SOA"];

        // Return raw structured data
        const data = {};
        results.forEach((r, i) => {
            data[types[i]] = r.status === "fulfilled" ? r.value : null;
        });

        res.json({
            domain,
            records: data
        });

    } catch (err) {
        res.status(500).json({ error: "DNS lookup failed" });
    }
});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
