import React from 'react';
import "../../app/globals.css"
import { Button } from '@/components/ui/button';
import {
    Home,
    Bug,
    FileText,
    Video,
    Code,
    HelpCircle,
    Menu
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
    return (
        <div className={`bg-white border-r transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-4 flex items-center justify-between border-b">
                {sidebarOpen ? (
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">Q</div>
                        <span className="ml-2 font-bold text-xl">QAID</span>
                    </div>
                ) : (
                    <div className="w-8 h-8 mx-auto bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">Q</div>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <Menu size={18} />
                </Button>
            </div>
            <nav className="p-3">
                <ul className="space-y-2">
                    <li>
                        <Button variant="ghost" className={`w-full justify-start ${sidebarOpen ? '' : 'justify-center'}`}>
                            <Home size={18} />
                            {sidebarOpen && <span className="ml-2">Dashboard</span>}
                        </Button>
                    </li>
                    <li>
                        <Button variant="ghost" className={`w-full justify-start ${sidebarOpen ? '' : 'justify-center'}`}>
                            <Bug size={18} />
                            {sidebarOpen && <span className="ml-2">Tracker</span>}
                        </Button>
                    </li>
                    <li>
                        <Button variant="ghost" className={`w-full justify-start ${sidebarOpen ? '' : 'justify-center'}`}>
                            <FileText size={18} />
                            {sidebarOpen && <span className="ml-2">Reports</span>}
                        </Button>
                    </li>
                    <li>
                        <Button variant="ghost" className={`w-full justify-start ${sidebarOpen ? '' : 'justify-center'}`}>
                            <Video size={18} />
                            {sidebarOpen && <span className="ml-2">Recordings</span>}
                        </Button>
                    </li>
                    <li>
                        <Button variant="ghost" className={`w-full justify-start ${sidebarOpen ? '' : 'justify-center'}`}>
                            <Code size={18} />
                            {sidebarOpen && <span className="ml-2">Scripts</span>}
                        </Button>
                    </li>
                    <li>
                        <Button variant="ghost" className={`w-full justify-start ${sidebarOpen ? '' : 'justify-center'}`}>
                            <HelpCircle size={18} />
                            {sidebarOpen && <span className="ml-2">Support</span>}
                        </Button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;