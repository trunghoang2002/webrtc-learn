import { Link } from "react-router-dom"

export default function Landing() {

    const name="prad";
    const age=26
    return(
        <>
        <h1>
            This is the Landing page. 
        </h1>
        <div className="flex flex-col items-center">
            <Link to={`/room/?name=${name}&age=${age}`}> Go to Room </Link>
            <Link to={'/video'}> Go to Video </Link>
            <Link to={'/pythonws'}> Go to Python Websocket </Link>
        </div>
        
        </>
    )
}