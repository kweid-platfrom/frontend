// components/stats/TeamProductivity.js
export const TeamProductivity = ({ teamData }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Productivity</h3>

        <div className="space-y-4">
            {teamData.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-600">{member.role}</div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="font-medium text-gray-900">{member.testsCreated}</div>
                        <div className="text-sm text-gray-600">tests this week</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);