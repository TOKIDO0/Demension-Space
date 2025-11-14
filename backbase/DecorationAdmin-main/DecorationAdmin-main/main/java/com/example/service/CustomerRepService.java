package com.example.service;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.*;
import com.example.exception.CustomException;
import com.example.mapper.ConstructionfundMapper;
import com.example.mapper.CustomerRepMapper;
import com.example.mapper.ReceiptMapper;
import com.example.mapper.UserMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@Service
public class CustomerRepService extends ServiceImpl<CustomerRepMapper, CustomerRep> {
    @Resource
    private ProjectService projectService;
    @Resource
    private StaffService staffService;
    @Resource
    private ReceiptService receiptService;
    @Resource
    private ConstructionfundService constructionfundService;
    @Resource
    private ReceiptMapper receiptMapper;
    @Resource
    private ConstructionfundMapper constructionfundMapper;

    public CustomerRep generate(Long id) {
        //System.out.println(id);
        Project one=projectService.getById(id);
        if(one==null)
        {
            throw new CustomException("-1", "无此项目");
        }
        List<Receipt> receipts = new ArrayList<>();
        List<Constructionfund> constructionfunds = new ArrayList<>();
//计算收款总额
        QueryWrapper<Receipt> wrapper1 =new QueryWrapper<>();
        wrapper1.eq("projectid",id);
        receipts=receiptMapper.selectList(wrapper1);
        Integer receipt1=0;
        for(Receipt receipt : receipts)
        {
            receipt1+=receipt.getMoney();
        }
//计算工程款
        QueryWrapper<Constructionfund> wrapper2 =new QueryWrapper<>();
        wrapper2.eq("projectid",id);
        constructionfunds=constructionfundMapper.selectList(wrapper2);
        Integer constructionfund=0;
        for(Constructionfund constructionfund1 : constructionfunds)
        {
            constructionfund+=constructionfund1.getMoney();
        }
//项目经理名
        Staff staff=staffService.getById( one.getManagerid());
//余额
        Integer remaining=0;
        remaining=one.getMoney()-receipt1;
//赋值
        CustomerRep customerRep=new CustomerRep();
        customerRep.setId(id);
        customerRep.setName(one.getName());
        customerRep.setCommunityid(one.getCommunityid());
        customerRep.setManagerid(one.getManagerid());
        customerRep.setManangername(staff.getName());
        customerRep.setPhone(staff.getPhone());
        customerRep.setFinalmoney(one.getMoney());
        customerRep.setConstructionfund(constructionfund);
        customerRep.setReceipt(receipt1);
        customerRep.setRemaining(remaining);

        return customerRep;


    }
}
