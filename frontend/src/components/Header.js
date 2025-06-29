import * as React from "react"

export default function Header(props){

return (
   <header >
    <div className="d-flex justify-content-center">
     <img src={props.logoSrc} className="App-logo " alt="logo"/>

    </div>

     <h1 className="d-flex justify-content-center">
        {props.pageTitle}
     </h1>

   </header>
)

}