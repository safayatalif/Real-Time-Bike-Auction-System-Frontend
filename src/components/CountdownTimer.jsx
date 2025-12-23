import { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate, onEnd, label = "Ends in" }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (Object.keys(remaining).length === 0) {
                clearInterval(timer);
                if (onEnd) onEnd();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const timerComponents = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval] && interval !== 'seconds' && interval !== 'minutes') {
            return;
        }

        timerComponents.push(
            <span key={interval} className="inline-block">
                <span className="font-bold text-lg">
                    {timeLeft[interval] < 10 ? `0${timeLeft[interval]}` : timeLeft[interval]}
                </span>
                <span className="text-xs uppercase ml-0.5 mr-2">
                    {interval.charAt(0)}
                </span>
            </span>
        );
    });

    return (
        <div className="flex items-center space-x-1 text-gray-700">
            {timerComponents.length > 0 ? (
                <>
                    <span className="text-sm font-medium mr-2">{label}:</span>
                    <div className="flex items-baseline text-primary-600">
                        {timerComponents}
                    </div>
                </>
            ) : (
                <span className="text-red-600 font-bold uppercase tracking-wider">Ended</span>
            )}
        </div>
    );
}
