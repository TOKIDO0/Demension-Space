package com.example.service;

import com.example.entity.Commission;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.CommissionMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class CommissionService extends ServiceImpl<CommissionMapper, Commission> {

    @Resource
    private CommissionMapper commissionMapper;

}
