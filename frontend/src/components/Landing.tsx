import { Link } from "react-router-dom"

export default function Landing() {

    const name="prad";
    const age=26
    return(
        <>
        <h1>
            This is the Landing page. 
        </h1>
        <Link to={`/room/?name=${name}&age=${age}`}> Go to Room </Link>
        </>
    )
}