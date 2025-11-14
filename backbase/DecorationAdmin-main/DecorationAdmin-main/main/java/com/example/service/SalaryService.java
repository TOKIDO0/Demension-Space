package com.example.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.Attendence;
import com.example.entity.Commission;
import com.example.entity.Salary;
import com.example.entity.Staff;
import com.example.exception.CustomException;
import com.example.mapper.AttendenceMapper;
import com.example.mapper.CommissionMapper;
import com.example.mapper.SalaryMapper;
import com.example.mapper.StaffMapper;
import jdk.nashorn.internal.runtime.Undefined;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import javax.annotation.Resource;
import java.util.List;


@Service
public class SalaryService extends ServiceImpl<SalaryMapper, Salary> {
    @Resource
    private StaffService staffService;
    @Resource
    private AttendenceService attendenceService;
    @Resource
    private CommissionService commissionService;
    @Resource
    private StaffMapper staffMapper;
    @Resource
    private AttendenceMapper attendenceMapper;
    @Resource
    private CommissionMapper commissionMapper;

    public Salary generate(long id,String date)
    {
        Salary one=new Salary();
        //员工基本信息
//        QueryWrapper<Staff> wrapper1=new QueryWrapper<>();
//        wrapper1.eq("id",id);
        Staff staff=staffService.getById(id);
        if(staff==null)
        {
            throw new CustomException("-1", "无此员工");
        }
        if (!(date instanceof String)){
            throw new CustomException("-2", "请选择年月");
        }
        //员工出勤状况
        QueryWrapper<Attendence> wrapper2=new QueryWrapper<>();
        wrapper2.eq("staffid",id)
                .like("date",date);
        int days=0;
        days=attendenceMapper.selectCount(wrapper2);
        if (days==0){
            throw new CustomException("-2", "请选择有效年月");
        }

        //员工提成
        QueryWrapper<Commission> wrapper3=new QueryWrapper<>();
        wrapper3.eq("staffid",id)
                .like("date",date);
        List<Commission> commissions =commissionMapper.selectList(wrapper3);
        int moneyofcommission=0;
        if(commissions.size()==0)
        {
            moneyofcommission=0;
        }
        else {
            for (Commission commission : commissions) {
                moneyofcommission += commission.getMoney();
            }
        }
        //员工罚款与全勤將
        float fine=0;
        float attendence=0;
        if(days<21)
        {
            attendence=0;
            float basicday=21;
            float salary1=0;
            salary1=staff.getBasicsalary();
            fine=salary1*((basicday- (float) days)/basicday);
        }
        else
        {
            attendence=200;
            fine=0;
        }
        //应发工资
        float salary=0;
        salary=(float)staff.getBasicsalary()-fine+attendence+moneyofcommission;

        //计算社保

        //养老保险
        float endowmentInsurance =0;
        endowmentInsurance= (float) (salary*0.08);
        //医疗保险
        float medicalInsurance=0;
        medicalInsurance= (float) (salary*0.02);
        //失业保险
        float unemploymentInsurance=0;
        unemploymentInsurance= (float) (salary*0.004);
        //住房公积金
        float HousingProvidentFund=0;
        HousingProvidentFund=(float) (salary*0.06);
        //个人所得税
        float tax=0;
        float salary1=salary;
        salary1=salary-endowmentInsurance-medicalInsurance-unemploymentInsurance-HousingProvidentFund-5000;
        if(salary1>0)
        {
            if(salary1<=3000)
            {
                tax= (float) (salary1*0.03);
            }
            else if (salary1<=12000)
            {
                tax= (float) (3000*0.03+(salary1-3000)*0.1);
            }
            else if (salary1<=25000)
            {
                tax= (float) (3000*0.03+9000*0.1+(salary1-13000)*0.2);
            }
            else if (salary1<=35000)
            {
                tax= (float) (3000*0.03+9000*0.1+13000*0.2+(salary1-25000)*0.25);
            }
            else if (salary1<=55000)
            {
                tax= (float) (3000*0.03+9000*0.1+13000*0.2+10000*0.25+(salary1-35000)*0.3);
            }
            else if (salary1<=80000)
            {
                tax= (float) (3000*0.03+9000*0.1+13000*0.2+10000*0.25+20000*0.3+(salary1-55000)*0.35);
            }
            else
            {
                tax= (float) (3000*0.03+9000*0.1+13000*0.2+10000*0.25+20000*0.3+25000*0.35+(salary1-80000)*0.45);
            }
        }
        else {
            tax=0;
        }

        float finalmoney=0;
        finalmoney=salary-tax-endowmentInsurance-medicalInsurance-unemploymentInsurance-HousingProvidentFund;



        //赋值

        one.setId(id);
        one.setName(staff.getName());
        one.setDays(days);
        one.setBasicsalary(staff.getBasicsalary());
        one.setCommisson(moneyofcommission);
        one.setAttendence(attendence);
        one.setFine(fine);
        one.setCardid(staff.getCard());
        one.setEndowmentInsurance(endowmentInsurance);
        one.setMedicalInsurance(medicalInsurance);
        one.setUnemploymentInsurance(unemploymentInsurance);
        one.setHousingProvidentFund(HousingProvidentFund);
        one.setSalary(salary);
        one.setTax(tax);
        one.setFinalsalary(finalmoney);


        return  one;


    }

}
