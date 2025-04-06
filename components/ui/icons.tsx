import { Loader2 } from "lucide-react"

export const Icons = {
  spinner: (props: React.SVGProps<SVGSVGElement>) => (
    <Loader2 className="animate-spin" {...props} />
  ),
}
