// CalendarTime.jsx - Fixed time display layout
import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '../../ui/button';

const CalendarTime = ({ disabled = false }) => {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarPosition, setCalendarPosition] = useState({
        top: 0,
        left: 0,
        right: 'auto'
    });

    const calendarRef = useRef(null);
    const calendarButtonRef = useRef(null);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const calculatePosition = () => {
        if (calendarButtonRef.current) {
            const rect = calendarButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 280;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            return {
                top: rect.bottom + window.scrollY + 4,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : windowWidth - rect.right,
            };
        }
        return { top: 0, left: 0, right: 'auto' };
    };

    const toggleCalendar = () => {
        if (disabled) return;
        if (!showCalendar) {
            const position = calculatePosition();
            setCalendarPosition(position);
        }
        setShowCalendar(!showCalendar);
    };

    // Close calendar when clicking outside
    useEffect(() => {
        if (disabled) return;

        const handleClickOutside = (event) => {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(event.target) &&
                calendarButtonRef.current &&
                !calendarButtonRef.current.contains(event.target)
            ) {
                setShowCalendar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [disabled]);

    // Format functions
    const formatTime = (date) => {
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        const [time, period] = timeStr.split(' ');
        return { time, period };
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateMobile = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    // Generate calendar days for current month
    const generateCalendarDays = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const currentDate = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return { days, currentMonth: month, currentYear: year, today: now.getDate() };
    };

    const calendarData = generateCalendarDays();
    const { time, period } = formatTime(currentDateTime);

    return (
        <>
            {/* Mobile Layout (xs to sm) */}
            <div className="flex items-center space-x-2 sm:hidden">
                {/* Mobile Date Button - Icon Only */}
                <Button
                    ref={calendarButtonRef}
                    variant="ghost"
                    size="iconSm"
                    onClick={toggleCalendar}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 transition-colors flex-shrink-0"
                    title={formatDate(currentDateTime)}
                >
                    <Calendar className="h-4 w-4 text-primary" />
                </Button>

                {/* Mobile Time Display - Compact */}
                <div className="flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 flex-shrink-0">
                    <div className="flex items-center space-x-1.5">
                        <div className="relative flex-shrink-0">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <div className="absolute inset-0 w-1.5 h-1.5 bg-primary rounded-full animate-ping opacity-75"></div>
                        </div>
                        <Clock className="h-3 w-3 text-primary/80 flex-shrink-0" />
                        <div className="font-mono text-xs font-medium text-primary whitespace-nowrap">
                            <span className="tabular-nums">{time.split(':').slice(0, 2).join(':')} {period}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tablet Layout (sm to lg) */}
            <div className="hidden sm:flex lg:hidden items-center space-x-2">
                {/* Tablet Date Button */}
                <Button
                    ref={calendarButtonRef}
                    variant="ghost"
                    onClick={toggleCalendar}
                    disabled={disabled}
                    leftIcon={<Calendar className="h-4 w-4 text-primary flex-shrink-0" />}
                    className="text-foreground hover:bg-accent/50 transition-colors flex-shrink-0"
                >
                    <span className="text-sm">{formatDateMobile(currentDateTime)}</span>
                </Button>

                {/* Tablet Time Display - Single line layout */}
                <div className="flex items-center px-2.5 py-1.5 rounded-md bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm flex-shrink-0 min-w-0">
                    <div className="flex items-center space-x-1.5 min-w-0">
                        <div className="relative flex-shrink-0">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <div className="absolute inset-0 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"></div>
                        </div>
                        <Clock className="h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
                        <div className="font-mono text-sm font-medium text-primary whitespace-nowrap">
                            <span className="tabular-nums">{`${time} ${period}`}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout (lg+) */}
            <div className="hidden lg:flex items-center space-x-3">
                <Button
                    ref={calendarButtonRef}
                    variant="ghost"
                    onClick={toggleCalendar}
                    disabled={disabled}
                    leftIcon={<Calendar className="h-4 w-4 text-primary" />}
                    className="text-foreground hover:bg-accent/50 transition-colors"
                >
                    {formatDate(currentDateTime)}
                </Button>

                <div className="flex items-center px-3 py-1.5 rounded-md bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <div className="absolute inset-0 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"></div>
                        </div>
                        <Clock className="h-3.5 w-3.5 text-primary/80" />
                        <div className="font-mono text-sm font-medium text-primary tracking-wider">
                            <span className="inline-block w-[95px] text-center tabular-nums">
                                {`${time} ${period}`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Dropdown */}
            {showCalendar && !disabled && (
                <div
                    ref={calendarRef}
                    className="fixed bg-card border border-border shadow-lg rounded-lg z-50"
                    style={{
                        top: `${calendarPosition.top}px`,
                        left: calendarPosition.left !== 'auto' ? `${calendarPosition.left}px` : 'auto',
                        right: calendarPosition.right !== 'auto' ? `${calendarPosition.right}px` : 'auto',
                        minWidth: window.innerWidth < 640 ? '280px' : '320px',
                        maxWidth: window.innerWidth < 640 ? '90vw' : '400px',
                    }}
                >
                    <div className="p-3 sm:p-4">
                        <div className="text-center mb-3 sm:mb-4">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground">
                                {new Date(calendarData.currentYear, calendarData.currentMonth).toLocaleDateString('en-US', {
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </h3>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="p-1.5 sm:p-2 text-muted-foreground font-medium">
                                    <span className="hidden sm:inline">{day}</span>
                                    <span className="sm:hidden">{day.charAt(0)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {calendarData.days.map((day, index) => {
                                const isCurrentMonth = day.getMonth() === calendarData.currentMonth;
                                const isToday = isCurrentMonth && day.getDate() === calendarData.today;

                                return (
                                    <Button
                                        key={index}
                                        variant={isToday ? "default" : "ghost"}
                                        size="iconXs"
                                        className={`h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm ${isCurrentMonth
                                                ? ''
                                                : 'text-secondary-foreground'
                                            } ${isToday ? 'font-bold' : ''}`}
                                    >
                                        {day.getDate()}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CalendarTime;