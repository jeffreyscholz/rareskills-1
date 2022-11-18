import { Button, Flex, Image, position, Text } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { useWeb3Context } from "../context/Web3Context";
import { useContracts } from "../hooks";


export function ForgeView () {
    const [{web3Provider, txPending}, dispatch] = useWeb3Context();
    const {nftContract, forgeContract} = useContracts();

    const [chosenTokens, setChosenTokens] = useState(
        new Array(3).fill(false)
    );

    const [resultToken, setResultToken] = useState("")

    const forge = useCallback(async () =>{
        if(
            chosenTokens.filter(x => x).length < 2 ||
            !web3Provider || txPending ||
            !nftContract
        ) {
            console.log('here')
            return;
        }

        dispatch({
            type: "SET_TX_PENDING",
            txPending: true
        });

        const signer = await web3Provider?.getSigner();

        try{
        for(let i = 0; i < 3; i++) {
            if(chosenTokens[i]) {
                const balance = await nftContract.balanceOf(await signer.getAddress(), i);
                if(balance == 0) {
                    window.alert("not enough balance");
                    dispatch({
                        type: "SET_TX_PENDING",
                        txPending: false
                    });
                    return;
                }
            }
        }
        } catch(e) {
            window.alert("Error while fetching balances");
            dispatch({
                type: "SET_TX_PENDING",
                txPending: false
            });
            return;
        }

        try{
            const forgeTx = await forgeContract?.connect(signer).forge(chosenTokens);
            const receipt = await forgeTx.wait()
        } catch(e) {
            window.alert("Forge Transaction Failed");
            dispatch({
                type: "SET_TX_PENDING",
                txPending: false
            });
            return;
        }

        dispatch({
            type: "SET_TX_PENDING",
            txPending: false
        });

        window.location.reload();
    }, [])

    const handleOnChange = (position: number) => {
        const updatedChosenTokens = chosenTokens.map((item, index) =>
            index === position ? !item : item
        ); 

        setChosenTokens(updatedChosenTokens);
        
        setChosenTokens((chosenTokens) => {
            if(chosenTokens[0] && chosenTokens[1] && chosenTokens[2]) {
                setResultToken('6')
            } else if (chosenTokens[0] && chosenTokens[1]) {
                setResultToken('3')
            } else if (chosenTokens[2] && chosenTokens[1]) {
                setResultToken('4')
            } else if (chosenTokens[0] && chosenTokens[2]) {
                setResultToken('5')
            } else {
                setResultToken('')
            }
            
            return chosenTokens;
        })

        
    }

    return (
        <div>
            <Flex>
                {
                    [0,1,2].map((token) => {
                        return (
                            <div>
                                <Image 
                                    boxSize='150px'
                                    objectFit='cover'
                                    fallbackSrc="https://via.placeholder.com/150"
                                    src="https://via.placeholder.com/150"
                                />
                                <Text>token: {token}</Text>
                                <input
                                    type="checkbox"
                                    id={`checkbox-${token}`}
                                    name={`token-${token}`}
                                    value={token}
                                    checked={chosenTokens[token]}
                                    onChange={()=>handleOnChange(token)}
                                />
                            </div>
                        )
                    })
                }
            </Flex>
            <Text>Forge result: {resultToken == ''? 'nothing' : resultToken}</Text>
            <Text>{resultToken == ''?'Select atleast two tokens to forge':''}</Text>
            <Button onClick={forge}>Forge</Button>
        </div>
    )

} 