import {
    Box,
    Image,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
    CHAT_BOT,
    ENHANCEMENT,
    ENHANCEMENT_SELECTED,
    EXPORT,
    EXPORT_SELECTED,
    MESSAGE,
    REPORT,
} from "../../../assets/Images";
import Header from "../../components/header";
import Enhancements from "../enhancements";

const TABS = [
    {
        name: "Privacy",
        icon: ENHANCEMENT,
        selectedIcon: ENHANCEMENT_SELECTED,
        component: <Enhancements />,
        disabled: false,
    },
    {
        name: "Reports",
        icon: REPORT,
        selectedIcon: REPORT,
        component: <div>Report</div>,
        disabled: true,
    },
    {
        name: "Message",
        icon: MESSAGE,
        selectedIcon: MESSAGE,
        component: <div>Message</div>,
        disabled: true,
    },
    {
        name: "Chat-Bot",
        icon: CHAT_BOT,
        selectedIcon: CHAT_BOT,
        component: <div>CHAT_BOT</div>,
        disabled: true,
    },
    {
        name: "Exports",
        icon: EXPORT,
        selectedIcon: EXPORT_SELECTED,
        component: <div>Export</div>,
        disabled: false,
    },
];

export default function Home() {
    const [tabIndex, setTabIndex] = useState(0);
    useEffect(() => {
        console.log("hello");
    }, []);
    return (
        <Box width="full" py={"1rem"} px={"1rem"}>
            <Header />

            <Tabs index={tabIndex} onChange={setTabIndex} pt={"1rem"}>
                <TabList
                    backgroundColor={"#3C3C3C"}
                    borderColor={"#3C3C3C"}
                    rounded={"lg"}
                >
                    {TABS.map((tab, index) => (
                        <Tab
                            key={index}
                            width={"12.5%"}
                            padding={0}
                            rounded={"lg"}
                            isDisabled={tab.disabled}
                            _selected={{ width: "50%", bgColor: "#4CB072" }}
                            transition="0.3s"
                        >
                            <Box
                                width="full"
                                height="full"
                                rounded="lg"
                                display="flex"
                                alignItems="center"
                                justifyContent={"center"}
                                gap={"0.5rem"}
                                padding={"0.5rem"}
                            >
                                <Image
                                    src={
                                        tabIndex === index
                                            ? tab.selectedIcon
                                            : tab.icon
                                    }
                                    width={4}
                                />
                                {tabIndex === index ? (
                                    <Text
                                        textColor="white"
                                        fontSize={"sm"}
                                        fontWeight="bold"
                                        transition="0.3s"
                                    >
                                        {tab.name}
                                    </Text>
                                ) : null}
                            </Box>
                        </Tab>
                    ))}
                </TabList>
                <TabPanels>
                    {TABS.map((tab, index) => (
                        <TabPanel key={index} padding={0}>
                            {tab.component}
                        </TabPanel>
                    ))}
                </TabPanels>
            </Tabs>
        </Box>
    );
}
