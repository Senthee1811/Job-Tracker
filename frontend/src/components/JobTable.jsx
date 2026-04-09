import React from 'react'

const JobTable = () => {
    const application_dummy = [] 
  return (
    <div className='bg-lime-300 max-w-5xl flex flex-col items-center justify-center rounded-2xl'>
        <table>
            <thead>
                <tr>
                    <th>Company</th>
                    <th>Title</th>
                    <th>Requirements</th>
                    <th>Mode</th>
                    <th>Salary</th>
                    <th>Location</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {
                    application_dummy.map((application, index) => (
                        <tr key={index}>
                            <td>{application}</td>
                        </tr>
                    ))
                }
                
            </tbody>
        </table>

    </div>
  )
}

export default JobTable