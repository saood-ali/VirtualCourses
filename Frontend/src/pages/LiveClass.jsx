import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import axiosClient from "../config/axiosClient.js";
import { toast } from 'react-toastify';

const APP_ID = Number(import.meta.env.VITE_ZEGO_APP_ID); 
const SERVER_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET;

// Helper: Generate a random ID for guest users
const randomID = (len = 5) => {
    let result = '';
    const chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP';
    const maxPos = chars.length;
    for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return result;
};

const LiveClass = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { userData } = useSelector((state) => state.user);

    const updateLiveStatus = useCallback(async (isLive) => {
        // Only educators update the status in the DB
        if (userData?.role !== 'educator') return;

        try {
            await axiosClient.put(`/api/course/golive/${courseId}`, {
                isLive,
            });
        } catch (error) {
            console.error("Failed to update live status", error);
        }
    }, [courseId, userData?.role]);

    const myMeeting = useCallback(async (element) => {
        if (!element) return;
        
        if (!APP_ID || !SERVER_SECRET) {
            toast.error("Video SDK keys missing! Check .env file.");
            return;
        }

        // 1. Generate Kit Token
        // Uses userData from Redux if available, otherwise generates random Guest ID
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            APP_ID, 
            SERVER_SECRET, 
            courseId, 
            userData?._id || randomID(), 
            userData?.name || "Guest Student"
        );

        // 2. Create Instance
        const zp = ZegoUIKitPrebuilt.create(kitToken);

        // 3. Determine Role from Redux State
        let role = ZegoUIKitPrebuilt.Audience;
        if (userData?.role === 'educator') {
            role = ZegoUIKitPrebuilt.Host;
        }

        // 4. Join Room
        zp.joinRoom({
            container: element,
            scenario: {
                mode: ZegoUIKitPrebuilt.LiveStreaming,
                config: {
                    role,
                },
            },
            sharedLinks: [
                {
                    name: 'Class Link',
                    url: window.location.href,
                },
            ],
            showUserList: true,
            
            // Event: When Educator Joins
            onJoinRoom: () => {
                if (userData?.role === 'educator') {
                    updateLiveStatus(true); 
                    toast.success("You are LIVE! 🔴");
                }
            },
            // Event: When Educator Leaves
            onLeaveRoom: () => {
                 if (userData?.role === 'educator') {
                    updateLiveStatus(false); 
                    navigate(-1); 
                 }
            },
        });
    }, [courseId, userData, navigate, updateLiveStatus]);

    return (
        <div className="flex h-screen bg-gray-900 justify-center items-center text-white">
            <div 
                className="w-full h-full"
                ref={myMeeting}
            ></div>
        </div>
    );
};

export default LiveClass;