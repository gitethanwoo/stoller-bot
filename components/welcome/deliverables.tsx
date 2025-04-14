import Image from "next/image"
import { Section } from "./section"

export function DeliverablesSection() {
  return (
    <Section
      id="deliverables"
      title="Deliverables"
      heading="We compiled our findings in a full length, 150+ page report, as well as a condensed readout"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <a 
          href="https://www.canva.com/design/DAGU9yPvDvE/er5q-HyHeSm0SWJ1Wm0BJQ/view?utm_content=DAGU9yPvDvE&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hf4d9b2732f"
          target="_blank"
          rel="noopener noreferrer"
          className="block space-y-4 transition-transform hover:scale-105"
        >
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
            <Image
              src="/report-cover.png"
              alt="The Full Report"
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold">The Full Report</h3>
        </a>
        <a 
          href="https://www.figma.com/proto/GzyQKHpyBelPUx6nP66bFO/Stoller%2B?page-id=777%3A844&node-id=777-3994&viewport=2786%2C325%2C0.54&t=brghLQjkNeb4Ltdi-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=777%3A3994"
          target="_blank"
          rel="noopener noreferrer"
          className="block space-y-4 transition-transform hover:scale-105"
        >
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/readout-cover.png"
              alt="Strategic Readout"
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold">Strategic Readout</h3>
        </a>
      </div>
    </Section>
  )
} 