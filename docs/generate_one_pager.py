"""Generate Agent Checkout one-pager investment memo PDF."""

from fpdf import FPDF


class MemoPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(80, 80, 80)
        self.cell(0, 8, "AGENT CHECKOUT  |  CONFIDENTIAL INVESTMENT MEMO", align="L")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, "Encode Agentathon 2026  |  Somnia Shannon Testnet", align="C")

    def section_title(self, title: str):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(0, 100, 70)
        self.cell(0, 7, title)
        self.ln(6)

    def body(self, text: str):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 4.5, text)
        self.ln(2)


def main():
    pdf = MemoPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(0, 80, 55)
    pdf.cell(0, 12, "Agent Checkout", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(
        0,
        5,
        "Agent-native Shopify commerce on Somnia - enabling AI agents to discover, pay for, and complete real-world purchases in under 2 minutes of merchant setup.",
    )
    pdf.ln(4)

    pdf.section_title("THE OPPORTUNITY")
    pdf.body(
        "Commerce is shifting from human browsers to autonomous AI agents. By 2030, analysts project a multi-trillion-dollar agent economy "
        "(WEF: ~$30T). Today, 12,000+ MCP servers expose tools to agents, and protocols like HTTP 402 (x402) are processing millions of "
        "machine-to-machine payments. Yet 4.8M+ Shopify merchants have no standard way to accept agent orders. Agent Checkout bridges "
        "the world's largest SMB ecommerce platform to the emerging agent commerce stack."
    )

    pdf.section_title("WHAT WE ARE BUILDING")
    pdf.body(
        "A plug-and-play layer that makes any Shopify store agent-ready: merchants register in ~2 minutes; AI agents discover products "
        "via Model Context Protocol (MCP), checkout via HTTP 402 Payment Required, settle in native STT on Somnia, and receive "
        "confirmed Shopify orders - with Somnia Agents providing consensus-validated pricing, address validation, and natural-language search."
    )

    pdf.section_title("UNIQUE SELLING POINT")
    pdf.body(
        "First unified stack combining (1) Shopify merchant onboarding, (2) MCP agent discovery, (3) HTTP 402 micropayments, and "
        "(4) Somnia Agents for oracle + validation - on a hyper-performant EVM L1 built for agentic applications. Competitors address "
        "fragments (payment rails OR commerce OR agents); we ship the full loop from 'find product' to 'paid Shopify order' in one repo."
    )

    pdf.section_title("WHY IT MATTERS")
    pdf.body(
        "Merchants unlock a new distribution channel (AI agents as customers) without replatforming. Agents gain a standardized, "
        "verifiable checkout rail instead of brittle web scraping. Somnia gains a flagship real-world commerce use case demonstrating "
        "native STT settlement, Somnia Agents, and sub-cent fees at scale."
    )

    pdf.section_title("TRACTION & STATUS")
    pdf.body(
        "Working prototype: Next.js merchant UI, dual MCP servers (shopping + payment), two-phase HTTP 402 checkout, on-chain STT "
        "verification on Shannon Testnet (chain 50312), Supabase persistence, Shopify Admin order sync. Built for Encode Agentathon; "
        "open-source and deployment-ready."
    )

    pdf.section_title("THE ASK / NEXT STEPS")
    pdf.body(
        "Hackathon completion + mainnet pilot with Somnia ecosystem partners. Roadmap: production Somnia Agents integration, "
        "multi-store agent marketplace, UCP/AP2 compatibility layer, and merchant analytics for agent-driven revenue."
    )

    out = "d:/agent-checkout/docs/Agent_Checkout_Investment_Memo_One_Pager.pdf"
    pdf.output(out)
    print(f"Created: {out}")


if __name__ == "__main__":
    main()
