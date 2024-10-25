import { useSearchParams } from "react-router-dom"

export default function Room() {
    const [searchParam] = useSearchParams();
    const name = searchParam.get("name");
    const age = searchParam.get("age");

    return(
        <>
        <h1> Hi {name}!! You look good for {age}</h1>
        </>
    )
}