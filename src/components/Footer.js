import React, { Component } from 'react'
import CLASSES from '../constants/classes'

export default class Footer extends Component {
    redirect = {
        "donate": {
            name: "Donate",
            url: "" // paypal url?
        },
        "contribute": {
            name: "Contribute",
            url: "" // github url
        },
        "report_bugs": {
            name: "Report Bugs",
            url: "" // github issues url
        },
        "contact": {
            name: "Contact",
            url: "" // popup with discord#tag
        }
    }
    
    render() {
        const buttons = ["donate", "contribute", "report_bugs", "contact"].map((myKey, index) => {
            const item = this.redirect[myKey]
            return <form key={item.name} action={item.url}>
            <button className={CLASSES.buttons} type="submit">{item.name}</button>
            </form>
        })

        return (
            <div className="flex flex-row">
                {this.buttons}
            </div>
        )
    }
}
