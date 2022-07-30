import WireguardContext from '@root/lib/state';
import WireGuard from '@components/reseda';
import type { NextPage } from 'next'
import { FC, useContext, useEffect, useState } from 'react'

const UsageGraph: FC<{ ekey: string, usage: any[] }> = ({ ekey, usage }) => {
    const [ data, setData ] = useState([]);
    const [ maxDataPoint, setMaxDataPoint ] = useState(1);

    useEffect(() => {
        setData(usage.filter(e => e[ekey]));
        setMaxDataPoint(data.sort((a,b)=>a-b)[data.length - 1]);
    }, [ usage ])

	return (
		<div className="flex flex-row flex-1 h-full w-full">
            {   
                data.map((e) => {
                    // console.log(e[ekey] / )
                    // return <div className="bg-slate-700" style={{ height: `${e[ekey] / maxDataPoint?.[ekey]}%`, width: `${e / data.length}%` }}></div>
                })
            }
		</div>
	)
}

export default UsageGraph
