import { Button, Flex, Image, Text, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useWeb3Context } from "../context/Web3Context";
import { useContracts, useWeb3 } from '../hooks/Web3Client';
import PopUp from 'reactjs-popup';

interface NftProps {
    tokenId: number;
    mintable: boolean;
}

export function NftView({tokenId, mintable}: NftProps) {
    const [balance, setBalance] = useState(0);
    const [{ address, network, web3Provider, txPending },dispatch] = useWeb3Context();
    const { nftContract, forgeContract } = useContracts();

    const MintButton = () => {
        const mint = useCallback(async () => {
            if(
                !web3Provider || !address 
                || network?.chainId != 80001
                || txPending
            ) {
                return;
            }

            dispatch({
                type: "SET_TX_PENDING",
                txPending: true
            });

            const signer = await web3Provider.getSigner();

            const cooldownTime = await forgeContract?.getMintCooldownTime(await signer.getAddress());
            if(Date.now()/1000 <= cooldownTime) {
                window.alert("mint cooldown active");
                dispatch({
                    type: "SET_TX_PENDING",
                    txPending: false
                });
                return;
            }

            try {
                const mintTx = await forgeContract?.connect(signer).mint(tokenId);
                const receipt = await mintTx.wait();
                console.log('here')
                dispatch({
                    type: "SET_TX_PENDING",
                    txPending: false
                });
            } catch (e) {
                window.alert("Tx failed");
                dispatch({
                    type: "SET_TX_PENDING",
                    txPending: false
                });
                return;
            }
            
            window.location.reload();
        }, [])
    
        return (
            <Button onClick= {mint} isDisabled={txPending}>
                Mint
            </Button>
        )
    }

    const BurnButton = () => {
        const burn = useCallback(async () => {
            if(!balance || !web3Provider || !address || network?.chainId != 80001) {
                return;
            }

            dispatch({
                type: "SET_TX_PENDING",
                txPending: true
            });

            const signer = await web3Provider.getSigner();

            try {
                const burnTx = await forgeContract?.connect(signer).burn(tokenId, 1);
                const receipt = await burnTx.wait();
                console.log('here')
                dispatch({
                    type: "SET_TX_PENDING",
                    txPending: false
                });
            } catch (e) {
                window.alert("Tx failed");
                dispatch({
                    type: "SET_TX_PENDING",
                    txPending: false
                });
                return;
            }
            
            window.location.reload();
        }, [])

        return (
            <Button onClick= {burn} isDisabled={txPending}>
                Burn
            </Button>
        )
    }

    const TradeButton = () => {

        const [chosenToken, setChosenToken] = useState(0);
        const { isOpen, onOpen, onClose } = useDisclosure()

        const trade = useCallback(async ()=>{
            if(!balance || !web3Provider || !address || network?.chainId != 80001) {
                return;
            }

            setChosenToken((chosenToken) => {
                
                return chosenToken;
            })

            if(chosenToken == tokenId) {
                console.log('here',chosenToken)
                window.alert("Cannot trade for the same token");
                return;
            }

            dispatch({
                type: "SET_TX_PENDING",
                txPending: true
            });

            const signer = await web3Provider.getSigner();

            try{
                const forgeTx = await forgeContract?.connect(signer).trade(tokenId, chosenToken, 1);
                const receipt = await forgeTx.wait();
            } catch(e) {
                window.alert("Tx failed");
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
        }, [chosenToken])

        const handleOnChange = (newToken: number) => {
            setChosenToken(newToken)
            console.log(chosenToken)
        }

        return (
            <div>
            <Button onClick={onOpen}>
                Trade
            </Button>
            <Modal isCentered={true} size='md' isOpen={isOpen} onClose={onClose}>
                <ModalOverlay 
                    bg='white.300'
                    backdropFilter='blur(10px) hue-rotate(90deg)'/>
                <ModalContent maxH="50%" maxW="50%" justifyContent="center">
                    <ModalHeader>Trade</ModalHeader>
                    <ModalBody>
                    <div style={{color: "white"}}>
            <Flex align="space-evenly" justify="center" gridGap="5%">
                {
                    [0,1,2].map((token) => {
                        return (
                            <div key={token.toString()} style={{ 'textAlign':'center' }}>
                                <Image 
                                    boxSize='150px'
                                    objectFit='cover'
                                    fallbackSrc="https://via.placeholder.com/150"
                                    src={`/${token}.jpg`}
                                />
                                <Text>token: {token}</Text>
                                <input
                                    type="radio"
                                    id={`checkbox-${token}`}
                                    name={`token-${token}`}
                                    value={token}
                                    checked={chosenToken==token}
                                    onChange={()=>handleOnChange(token)}
                                />
                            </div>
                        )
                    })
                }
            </Flex>
        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme='blue' mr={3} onClick={trade}>
                            Trade
                        </Button>
                        <Button variant='ghost' onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
                
            </Modal>
            </div>
        )
    }

    useEffect(() => {
        async function getBalance() {
            if(!nftContract || !address) {
                return;
            }
            const balance = await nftContract.balanceOf(address, tokenId);
            setBalance(JSON.parse(balance));
        }

        getBalance();
    },[address])

    return (
        <div style={{ 'textAlign':'center' }}>
            <Image 
                boxSize='150px'
                objectFit='cover'
                fallbackSrc="https://vga.placeholder.com/150"
                src={`/${tokenId}.jpg`}
            />
            <Text>token: {tokenId}</Text>
            <Text>balance: {balance}</Text>
            {mintable ?< MintButton/> : <BurnButton/>}
            <div><TradeButton/></div>
        </div>
    )
}