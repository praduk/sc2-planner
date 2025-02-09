import React, { Component } from "react"
import ReactTooltip from "react-tooltip"
import { CONVERT_SECONDS_TO_TIME_STRING, createUrlParams } from "../constants/helper"

import CLASSES from "../constants/classes"
import UNITS_BY_NAME from "../constants/units_by_name"
import UPGRADE_BY_NAME from "../constants/upgrade_by_name"
import { GameLogic } from "../game_logic/gamelogic"
import { IAllRaces, IBuildOrderElement, ISettingsElement } from "../constants/interfaces"
import { CUSTOMACTIONS_BY_NAME } from "../constants/customactions"

interface MyProps {
    gamelogic: GameLogic
    rerunBuildOrder: (buildOrder: IBuildOrderElement[]) => void
    updateUrl: (
        race: IAllRaces | undefined,
        buildOrder: IBuildOrderElement[],
        settings: ISettingsElement[] | undefined,
        optimizeSettings: ISettingsElement[] | undefined,
        pushHistory?: boolean
    ) => void
}

export default class ImportExport extends Component<MyProps> {
    /**
     * Allow export: shareable-url, SALT, instructions
     * Allow import: shareable-url, instructions
     */
    state = {
        // Variable to show dropdown
        export: false,
        import: false,
        tooltipText: "",
        //templateString: "$time $supply $action",
        templateString: "$time $action",
        templateStringTooltip: "",
        humanReadableIncludeWorkers: false,
        humanReadableIncludeActions: true,
    }

    onMouseEnter = (_e: React.MouseEvent<HTMLDivElement, MouseEvent>, name: string): void => {
        // On mouse enter: open drop down menu with various options
        this.setState({
            [name]: true,
        })
        this.updateTemplateStringTooltip()
    }

    onMouseLeave = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, name: string): void => {
        // On mouse exit: close the above
        this.setState({
            [name]: false,
        })
    }

    onClickExport = (_e: React.MouseEvent<HTMLDivElement, MouseEvent>, name: string): void => {
        // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
        let clipBoardText = ""
        // TODO Create build order in the desired format
        if (name === "Copy shareable link") {
            clipBoardText = this.generateShareableLink()
        } else if (name === "Copy human instructions") {
            clipBoardText = this.generateHumanInstructions().join("\n")
        } else if (name === "Copy SC2 bot instructions") {
            clipBoardText = this.generateBotInstructions()
        } else if (name === "Copy SALT encoding") {
            // clipBoardText = this.generateSALTEncoding()
        }
        if (clipBoardText !== "") {
            navigator.clipboard.writeText(clipBoardText).then(
                () => {
                    // console.log(name)
                },
                () => {
                    console.log("fail")
                }
            )

            this.setState({
                tooltipText: "Copied!",
            })
        }
    }

    // onClickImport = (_e: React.MouseEvent<HTMLDivElement, MouseEvent>, _name: string) => {
    //     // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
    //     navigator.clipboard.readText().then((data) => {
    //         const decodedSALT = decodeSALT(data)
    //         const race = decodedSALT.race as IAllRaces | undefined
    //         const bo = decodedSALT.bo as IBuildOrderElement[]
    //         this.setState({
    //             tooltipText: 'Pasted!',
    //         })
    //         this.props.rerunBuildOrder(bo)
    //         this.props.updateUrl(race, bo, undefined, undefined)
    //     })
    // }

    onLeaveButton = (_e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        this.setState({
            tooltipText: "",
        })
    }

    generateShareableLink(): string {
        // Returns the string of the shareable link
        const gamelogic = this.props.gamelogic
        const newUrl = createUrlParams(
            gamelogic.race,
            gamelogic.exportSettings(),
            gamelogic.exportOptimizeSettings(),
            gamelogic.bo
        )
        return `https://burnysc2.github.io/sc2-planner/${newUrl}`
    }

    generateHumanInstructions(
        templateString = "$time $supply $action",
        includeWorkers = this.state.humanReadableIncludeWorkers,
        includeActions = this.state.humanReadableIncludeActions
    ): string[] {
        // Returns a human readable build order instruction
        const gamelogic = this.props.gamelogic
        const instructions: Array<string> = []
        let first_orbital = true
        let first_barracks = true
        gamelogic.eventLog.forEach((item) => {
            let instructionString = templateString
            let itemName = item.name
            if( itemName == "SupplyDepot") {
                itemName = "Depot"
            }
            if( itemName == "Barracks") {
                if(first_barracks) {
                    itemName = "!barracks"
                    first_barracks = false
                }
            }
            if( itemName == "CommandCenter") {
                itemName = "Command Center"
            }
            if( itemName == "OrbitalCommand") {
                if(first_orbital) {
                    itemName = "!orbital"
                    first_orbital = false
                } else {
                    itemName = "Orbital Command"
                }
            }
            if( itemName == "Viking Fighter") {
                itemName = "Viking"
            }
            if( itemName == "SiegeTank") {
                itemName = "Siege Tank"
            }
            if( itemName == "FactoryTechLab") {
                itemName = "Factory Tech Lab"
            }
            if( itemName == "BarracksTechLab") {
                itemName = "Barracks Tech Lab"
            }
            if( itemName == "StarportTechLab") {
                itemName = "Starport Tech Lab"
            }
            if( itemName == "FactoryReactor") {
                itemName = "Factory Reactor"
            }
            if( itemName == "BarracksReactor") {
                itemName = "Barracks Reactor"
            }
            if( itemName == "StarportReactor") {
                itemName = "Starport Reactor"
            }
            if (item.type === "action") {
                const action = CUSTOMACTIONS_BY_NAME[item.name]
                itemName = action.name
                if( itemName == "Stop mine gas") {
                    itemName = "Worker off gas"
                }
                if( itemName == "Mine gas") {
                    itemName = "Worker back on gas"
                }
                if( itemName == "3x Mine gas") {
                    itemName = "Mine gas"
                }
            }
            const replaceValues: { [name: string]: string } = {
                $time: CONVERT_SECONDS_TO_TIME_STRING(item.start / 22.4),
                //$supply: `${item.supply}`,
                $supply: "",
                $action: itemName,
            }
            for (const replaceString in replaceValues) {
                const value = replaceValues[replaceString]
                instructionString = instructionString.replace(replaceString, value)
            }
            if (item.type === "action" && includeActions) {
                instructions.push(instructionString)
            } else if (item.type === "worker" && includeWorkers) {
                instructions.push(instructionString)
            } else if (!["action", "worker"].includes(item.type)) {
                instructions.push(instructionString)
            }
        })
        return instructions
    }

    generateBotInstructions(): string {
        // Returns a bot readable build order instruction as a json
        const gamelogic = this.props.gamelogic
        // Reduce instruction to: [name, id, type, supply, time, frame]
        const instructions: Array<{
            name: string
            id: number
            type: string
            supply: number
            time: string
            frame: number
        }> = []
        gamelogic.eventLog.forEach((item) => {
            instructions.push({
                name: item.name,
                id:
                    item.type === "action"
                        ? -1
                        : item.type === "upgrade"
                        ? UPGRADE_BY_NAME[item.name].id
                        : UNITS_BY_NAME[item.name].id,
                type: item.type,
                supply: item.supply,
                time: CONVERT_SECONDS_TO_TIME_STRING(item.start / 22.4),
                frame: Math.floor(item.start),
            })
        })
        return JSON.stringify(instructions, null, 4)
    }

    // generateSALTEncoding() {
    //     const encodedSalt = encodeSALT(this.props.gamelogic.eventLog as IBuildOrderElement[])
    //     console.log(encodedSalt)
    //     return encodedSalt
    // }

    formatListToHtmlLines(list: Array<string>): JSX.Element[] {
        // Converts a list of elements to a list where each element gets wrapped into a <div>
        const htmlStuff: Array<JSX.Element> = []
        list.forEach((item, index) => {
            htmlStuff.push(<div key={`buildOrderItem${item}${index}`}>{item}</div>)
        })
        return htmlStuff
    }

    updateTemplateStringTooltip(
        templateString = this.state.templateString,
        workers = this.state.humanReadableIncludeWorkers,
        actions = this.state.humanReadableIncludeActions
    ): void {
        this.setState({
            templateStringTooltip: this.formatListToHtmlLines(
                this.generateHumanInstructions(templateString, workers, actions)
            ),
        })
    }

    render(): JSX.Element {
        const classes = CLASSES.dropDown
        const classesExportDropdown = this.state.export ? `visible ${classes}` : `hidden ${classes}`
        const classesImportDropdown = this.state.import ? `visible ${classes}` : `hidden ${classes}`

        const exportElements = [
            "Copy shareable link",
            "Copy human instructions",
            "Copy SC2 bot instructions",
            // "Copy SALT encoding",
        ].map((item) => {
            const otherIcons = []
            if (item === "Copy human instructions") {
                otherIcons.push(
                    <div key={item} data-tip data-for="templateStringTooltip">
                        <input
                            type="text"
                            className="w-48"
                            onChange={(e) => {
                                this.setState({
                                    templateString: e.target.value,
                                    templateStringTooltip: this.formatListToHtmlLines(
                                        this.generateHumanInstructions(e.target.value)
                                    ),
                                })
                            }}
                            placeholder="$time $supply $action"
                            value={this.state.templateString}
                        />

                        <input
                            defaultChecked={this.state.humanReadableIncludeWorkers}
                            type="checkbox"
                            onChange={(e) => {
                                this.updateTemplateStringTooltip(undefined, e.target.checked)
                                this.setState({
                                    humanReadableIncludeWorkers: e.target.checked,
                                })
                            }}
                        />

                        <label>Workers</label>

                        <input
                            defaultChecked={this.state.humanReadableIncludeActions}
                            type="checkbox"
                            onChange={(e) => {
                                this.updateTemplateStringTooltip(
                                    undefined,
                                    undefined,
                                    e.target.checked
                                )
                                this.setState({
                                    humanReadableIncludeActions: e.target.checked,
                                })
                            }}
                        />

                        <label>Actions</label>
                    </div>
                )
            }
            return (
                <div
                    key={`${item}`}
                    data-tip={this.state.tooltipText}
                    data-for="importExportTooltip"
                    className={CLASSES.dropDownContainer}
                >
                    <div
                        onMouseLeave={this.onLeaveButton}
                        onClick={(e) => this.onClickExport(e, item)}
                        className={CLASSES.dropDownButton}
                    >
                        {item}
                    </div>
                    {otherIcons}
                </div>
            )
        })

        const importElements = [
            // "Paste SALT instructions"
        ].map((item) => {
            return (
                <div
                    key={`${item}`}
                    data-tip={this.state.tooltipText}
                    data-for="importExportTooltip"
                    onMouseLeave={this.onLeaveButton}
                    // onClick={(e) => this.onClickImport(e, item)}
                    className={CLASSES.dropDownContainer}
                >
                    <div className={CLASSES.dropDownButton}>{item}</div>
                </div>
            )
        })

        const exportButton = (
            <div
                className={CLASSES.buttons}
                onMouseEnter={(e) => this.onMouseEnter(e, "export")}
                onMouseLeave={(e) => this.onMouseLeave(e, "export")}
            >
                Export
                <div className={classesExportDropdown}>{exportElements}</div>
            </div>
        )

        // eslint-disable-next-line
        const _importButton = (
            <div
                className={CLASSES.buttons}
                onMouseEnter={(e) => this.onMouseEnter(e, "import")}
                onMouseLeave={(e) => this.onMouseLeave(e, "import")}
            >
                Import
                <div className={classesImportDropdown}>{importElements}</div>
            </div>
        )

        return (
            <div className="flex flex-row">
                <ReactTooltip place="bottom" id="importExportTooltip">
                    {this.state.tooltipText}
                </ReactTooltip>
                <ReactTooltip place="bottom" id="templateStringTooltip">
                    {this.state.templateStringTooltip}
                </ReactTooltip>
                {exportButton}
                {/* TODO Re-enable import button if there are features available that use the import button */}
                {/* {importButton} */}
            </div>
        )
    }
}
