import { AnimatedTabs } from "./AnimatedTabs"

const Demo = () => {
    return (
        <>
        <AnimatedTabs
            tabs={[
                { label: "Home" },
                { label: "About" },
                { label: "Resources" },
                { label: "Docs" },
                { label: "Support" },
            ]}
            />
        </>
    )
}

export { Demo }
