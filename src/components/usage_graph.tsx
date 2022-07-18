import WireguardContext from '@root/lib/state';
import WireGuard from '@root/reseda';
import type { NextPage } from 'next'
import { FC, useContext, useEffect, useState } from 'react'

const UsageGraph: FC<{ ekey: string }> = ({ ekey }) => {
    const [data, setData] = useState([]);

    const { usage } = useContext(WireguardContext);

    useEffect(() => {
        setData(usage.filter(e => e[ekey]));

        // console.log(data);
    }, [ usage ])

	return (
		<div>
			{
                data.length
            }
		</div>
	)
}

export default UsageGraph
