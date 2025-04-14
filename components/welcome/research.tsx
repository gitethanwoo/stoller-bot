import { Section } from "./section"

export function ResearchSection() {
  return (
    <Section
      id="research"
      title="Research"
      heading="We analyzed top streaming platforms, content libraries, business models and conducted UXR to understand the audience we need to serve"
      showArrow
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="text-xl">3 months</div>
          <div className="text-xl">7 professionals</div>
          <div className="text-xl">1700 respondents</div>
          <div className="text-xl">Analyzed 40+ content businesses</div>
          <div className="text-xl">Analyzed 500+ content assets</div>
          <div className="text-xl">Reviewed 20+ related research reports</div>
        </div>
      </div>
    </Section>
  )
} 