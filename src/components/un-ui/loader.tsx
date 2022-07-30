export const Loader = ({ color, height }) => {
    return (
        <svg id="spinner" width={height} height={height} viewBox="0 0 16 16" fill="none" strokeLinecap="round" stroke={color ?? "#ffffff"} strokeWidth="1px" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <circle className="spinner-line" cx="8" cy="8" r="7" strokeDasharray={"1 0.8"} strokeDashoffset="1" pathLength="1"></circle><circle cx="8" cy="8" r="7" strokeOpacity="0.1" strokeDasharray="0.8 1" pathLength="1"></circle><circle cx="8" cy="8" r="7" strokeOpacity="0.3" strokeDasharray="0.2 1" pathLength="1" transform="rotate(-72 8 8)"></circle></svg>
    )
}
export default Loader;