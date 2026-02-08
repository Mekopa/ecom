import { EllipseMiniSolid } from "@medusajs/icons"
import { Label, RadioGroup, Text, clx } from "@medusajs/ui"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: any
  handleChange: (...args: any[]) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="flex flex-col gap-y-3">
      <Text className="txt-compact-small-plus text-ui-fg-muted">{title}</Text>
      <RadioGroup data-testid={dataTestId} onValueChange={handleChange} className="flex flex-col gap-y-0.5">
        {items?.map((i) => {
          const isActive = i.value === value
          return (
            <div
              key={i.value}
              className={clx(
                "flex items-center gap-x-2 px-2 py-1.5 rounded-md transition-colors hover:cursor-pointer",
                {
                  "bg-ui-bg-base-pressed": isActive,
                }
              )}
            >
              <span className="w-4 flex items-center justify-center shrink-0">
                {isActive && <EllipseMiniSolid />}
              </span>
              <RadioGroup.Item
                checked={isActive}
                className="hidden peer"
                id={i.value}
                value={i.value}
              />
              <Label
                htmlFor={i.value}
                className={clx(
                  "!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer",
                  {
                    "text-ui-fg-base font-medium": isActive,
                  }
                )}
                data-testid="radio-label"
                data-active={isActive}
              >
                {i.label}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}

export default FilterRadioGroup
